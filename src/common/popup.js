// Cross-browser compatibility layer - Complete rewrite to avoid const issues
(function() {
    // Use var to avoid any const/let issues
    var api = typeof browser !== 'undefined' ? browser : chrome;
    var isFirefox = typeof browser !== 'undefined';

    document.addEventListener('DOMContentLoaded', function() {
        var extractBtn = document.getElementById('extractBtn');
        var status = document.getElementById('status');

        extractBtn.addEventListener('click', async function() {
            try {
                // Check popup permission first
                if (!isFirefox) {
                    var canOpenPopups = await checkPopupPermission();
                    if (!canOpenPopups) {
                        showStatus('Popup permission required for results display', 'error');
                        return;
                    }
                }

                // Get active tab
                var tabs = await queryTabs({ active: true, currentWindow: true });
                var activeTab = tabs[0];

                // Execute script based on browser
                if (isFirefox) {
                    // Firefox - Manifest V2
                    await executeScriptFirefox(activeTab.id);
                } else {
                    // Chrome/Edge - Manifest V3
                    await api.scripting.executeScript({
                        target: { tabId: activeTab.id },
                        function: extractPOCData
                    });
                }

                showStatus('Data extraction started! Check the new tab for results.', 'success');
            } catch (error) {
                showStatus('Error: ' + error.message, 'error');
                console.error('Extension error:', error);
            }
        });

        // Helper functions
        function queryTabs(query) {
            return new Promise(function(resolve) {
                api.tabs.query(query, resolve);
            });
        }

        function executeScriptFirefox(tabId) {
            return new Promise(function(resolve, reject) {
                api.tabs.executeScript(tabId, {
                    code: '(' + extractPOCData.toString() + ')()'
                }, function(result) {
                    if (api.runtime.lastError) {
                        reject(api.runtime.lastError);
                    } else {
                        resolve(result);
                    }
                });
            });
        }

        function checkPopupPermission() {
            return new Promise(function(resolve) {
                api.permissions.contains({
                    permissions: ['tabs']
                }, function(hasPermission) {
                    if (hasPermission) {
                        resolve(true);
                    } else {
                        api.permissions.request({
                            permissions: ['tabs']
                        }, function(granted) {
                            if (granted) {
                                showStatus('Permission granted! Click extract again.', 'success');
                                resolve(true);
                            } else {
                                resolve(false);
                            }
                        });
                    }
                });
            });
        }

        function showStatus(message, type) {
            status.textContent = message;
            status.className = 'status ' + type;
            status.style.display = 'block';
            
            setTimeout(function() {
                status.style.display = 'none';
            }, 4000);
        }
    });

    // POC extraction function - rewritten to avoid const
    function extractPOCData() {
        function delay(ms) {
            return new Promise(function(resolve) {
                setTimeout(resolve, ms);
            });
        }

        function extractTableData(tableContainer) {
            return new Promise(function(resolve) {
                var extractedData = [];
                var rows = tableContainer.querySelectorAll('.comp--gridtable__row');
                
                var processRow = function(index) {
                    if (index >= rows.length) {
                        resolve(extractedData);
                        return;
                    }

                    var row = rows[index];
                    var nameCell = row.querySelector('[data-walk-through-id*="-cell-name"]');
                    var designationCell = row.querySelector('[data-walk-through-id*="-cell-designation"]');
                    
                    if (!nameCell) {
                        processRow(index + 1);
                        return;
                    }
                    
                    var nameText = nameCell.textContent.trim().replace(/^\d+\.\s*/, '');
                    nameText = nameText.split('\n')[0].trim();
                    var designation = designationCell ? designationCell.textContent.trim() : '';
                    
                    var emailIcon = nameCell.querySelector('span.fa-envelope');
                    var email = '';
                    
                    if (emailIcon) {
                        var existingDropdowns = document.querySelectorAll('.listDropdown__wrapper');
                        for (var i = 0; i < existingDropdowns.length; i++) {
                            if (existingDropdowns[i].style.display !== 'none') {
                                existingDropdowns[i].style.display = 'none';
                            }
                        }
                        
                        emailIcon.click();
                        
                        setTimeout(function() {
                            var emailDropdown = document.querySelector('.listDropdown__wrapper:not([style*="display: none"])');
                            if (emailDropdown) {
                                var emailLink = emailDropdown.querySelector('a[href^="mailto:"]');
                                if (emailLink) {
                                    email = emailLink.textContent.trim();
                                }
                            }
                            
                            document.body.click();
                            
                            setTimeout(function() {
                                extractedData.push({
                                    pocRole: designation,
                                    pocName: nameText,
                                    pocEmail: email
                                });
                                processRow(index + 1);
                            }, 200);
                        }, 500);
                    } else {
                        extractedData.push({
                            pocRole: designation,
                            pocName: nameText,
                            pocEmail: email
                        });
                        processRow(index + 1);
                    }
                };
                
                processRow(0);
            });
        }

        // Main execution
        (function() {
            var targetSections = ["Founders & Key People", "Senior Management"];
            var allData = [];
            var headers = document.querySelectorAll('.txn--dp-subheader');
            var processedSections = 0;
            
            function processSection(index) {
                if (index >= headers.length) {
                    displayResults();
                    return;
                }

                var header = headers[index];
                var sectionTitle = header.textContent.trim();
                
                if (targetSections.indexOf(sectionTitle) !== -1) {
                    var tableContainer = header.parentElement.querySelector('.comp--gridtable__wrapper-v2');
                    if (!tableContainer) {
                        var nextDiv = header.parentElement.nextElementSibling;
                        if (nextDiv) {
                            tableContainer = nextDiv.querySelector('.comp--gridtable__wrapper-v2');
                        }
                    }
                    
                    if (tableContainer) {
                        extractTableData(tableContainer).then(function(sectionData) {
                            allData = allData.concat(sectionData);
                            processSection(index + 1);
                        });
                        return;
                    }
                }
                
                processSection(index + 1);
            }
            
            function displayResults() {
                try {
                    var newWindow = window.open('', '_blank', 'width=1200,height=700,scrollbars=yes,resizable=yes');
                    
                    if (!newWindow) {
                        alert('Popup blocked! Please allow popups for this site and try again.');
                        return;
                    }
                    
                    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>POC Automator - Results</title>';
                    html += '<style>';
                    html += 'body{font-family:Arial,sans-serif;margin:20px;background:#f5f5f5}';
                    html += '.container{background:white;padding:30px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1)}';
                    html += 'h1{color:#1a73e8;margin-top:0}';
                    html += 'table{border-collapse:collapse;width:100%;margin-top:20px}';
                    html += 'th,td{border:1px solid #ddd;padding:15px;text-align:left}';
                    html += 'th{background:#1a73e8;color:white;font-weight:600}';
                    html += 'tr:nth-child(even){background:#f8f9fa}';
                    html += 'tr:hover{background:#e3f2fd}';
                    html += '.stats{background:#e8f5e8;padding:20px;border-radius:8px;margin-bottom:20px}';
                    html += '.no-email{color:#999;font-style:italic}';
                    html += '.download-btn{background:#28a745;color:white;padding:12px 24px;border:none;border-radius:6px;cursor:pointer;margin:10px 5px 0 0}';
                    html += '</style></head><body>';
                    html += '<div class="container">';
                    html += '<h1>POC Automator - Extraction Results</h1>';
                    html += '<div class="stats">Total records extracted: <strong>' + allData.length + '</strong></div>';
                    html += '<button class="download-btn" onclick="downloadCSV()">Download CSV</button>';
                    html += '<table><thead><tr><th>POC Role</th><th>POC Name</th><th>POC Email</th></tr></thead><tbody>';

                    for (var i = 0; i < allData.length; i++) {
                        var item = allData[i];
                        var emailDisplay = item.pocEmail || '<span class="no-email">Email not found</span>';
                        html += '<tr><td>' + item.pocRole + '</td><td>' + item.pocName + '</td><td>' + emailDisplay + '</td></tr>';
                    }

                    html += '</tbody></table></div>';
                    html += '<script>';
                    html += 'function downloadCSV() {';
                    html += 'var data = ' + JSON.stringify(allData) + ';';
                    html += 'var csv = "POC Role,POC Name,POC Email\\n";';
                    html += 'for(var i = 0; i < data.length; i++) {';
                    html += 'csv += "\\"" + data[i].pocRole + "\\",\\"" + data[i].pocName + "\\",\\"" + data[i].pocEmail + "\\"\\n";';
                    html += '}';
                    html += 'var blob = new Blob([csv], { type: "text/csv" });';
                    html += 'var url = window.URL.createObjectURL(blob);';
                    html += 'var a = document.createElement("a");';
                    html += 'a.href = url;';
                    html += 'a.download = "poc-data-" + new Date().toISOString().split("T")[0] + ".csv";';
                    html += 'a.click();';
                    html += 'window.URL.revokeObjectURL(url);';
                    html += '}';
                    html += '</script></body></html>';

                    newWindow.document.write(html);
                    newWindow.document.close();
                    
                } catch (error) {
                    console.error('Error:', error);
                    alert('An error occurred during extraction: ' + error.message);
                }
            }
            
            processSection(0);
        })();
    }
})();
