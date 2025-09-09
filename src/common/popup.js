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

    // Your existing extraction function
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
                        }
                    }
                }
                
                // Create results window with enhanced features
                let newWindow = null;
                try {
                    newWindow = window.open('', '_blank', 'width=1200,height=700,scrollbars=yes,resizable=yes');
                } catch (e) {
                    console.error('Popup blocked:', e);
                }
                
                if (!newWindow) {
                    alert('Popup blocked! Please allow popups for this site and try again.');
                    return;
                }
                
                const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>POC Automator - Extract Results</title>
<style>
body{font-family:Arial,sans-serif;margin:20px;background:#f5f5f5}
.container{background:white;padding:30px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1)}
h1{color:#1a73e8;margin-top:0;display:flex;align-items:center}
.logo{width:32px;height:32px;margin-right:12px;background:#1a73e8;border-radius:6px;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold}
table{border-collapse:collapse;width:100%;margin-top:20px;background:white}
th,td{border:1px solid #ddd;padding:15px;text-align:left;vertical-align:top}
th{background:linear-gradient(135deg,#1a73e8,#4285f4);color:white;font-weight:600}
tr:nth-child(even){background:#f8f9fa}
tr:hover{background:#e3f2fd}
.stats{background:linear-gradient(135deg,#e8f5e8,#d4edda);padding:20px;border-radius:8px;margin-bottom:20px;border-left:4px solid #28a745}
.no-email{color:#999;font-style:italic}
.download-btn{background:linear-gradient(135deg,#28a745,#34ce57);color:white;padding:12px 24px;border:none;border-radius:6px;cursor:pointer;margin:10px 5px 0 0;font-weight:500;transition:all 0.3s}
.download-btn:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(40,167,69,0.3)}
.print-btn{background:linear-gradient(135deg,#6c757d,#868e96)}
.print-btn:hover{box-shadow:0 4px 12px rgba(108,117,125,0.3)}
.footer{margin-top:30px;padding-top:20px;border-top:1px solid #dee2e6;color:#6c757d;font-size:14px}
</style>
</head><body>
<div class="container">
<h1><div class="logo">PA</div>POC Automator - Extraction Results</h1>
<div class="stats">📊 <strong>${allData.length} contacts extracted</strong> from company profile tables</div>
<button class="download-btn" onclick="downloadCSV()">📥 Download CSV</button>
<button class="download-btn print-btn" onclick="window.print()">🖨️ Print Results</button>
<table>
<thead><tr><th>POC Role</th><th>POC Name</th><th>POC Email</th></tr></thead><tbody>`;

                allData.forEach(item => {
                    const emailDisplay = item.pocEmail || '<span class="no-email">Email not found</span>';
                    html += `<tr><td>${item.pocRole}</td><td>${item.pocName}</td><td>${emailDisplay}</td></tr>`;
                });

                html += `</tbody></table>
<div class="footer">
<p>Generated by POC Automator on ${new Date().toLocaleString()}</p>
</div>
</div>
<script>
function downloadCSV() {
    const data = ${JSON.stringify(allData)};
    let csv = "POC Role,POC Name,POC Email\\n";
    data.forEach(row => {
        csv += \`"\${row.pocRole}","\${row.pocName}","\${row.pocEmail}"\\n\`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'poc-data-' + new Date().toISOString().split('T')[0] + '.csv';
    a.click();
    window.URL.revokeObjectURL(url);
}
</script>
</body></html>`;

                newWindow.document.write(html);
                newWindow.document.close();
                
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred during extraction: ' + error.message);
            }
        })();
    }
})();