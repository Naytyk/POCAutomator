// Cross-browser compatibility layer
(function() {
    // Detect browser API namespace
    const api = typeof browser !== 'undefined' ? browser : chrome;
    const isFirefox = typeof browser !== 'undefined';

    document.addEventListener('DOMContentLoaded', function() {
        const traxcnBtn = document.getElementById('traxcnBtn');
        const apolloBtn = document.getElementById('apolloBtn');
        const status = document.getElementById('status');

        traxcnBtn.addEventListener('click', async function() {
            await handleExtraction('traxcn');
        });

        apolloBtn.addEventListener('click', async function() {
            await handleExtraction('apollo');
        });

        async function handleExtraction(platform) {
            try {
                // Check popup permission first
                if (!isFirefox) {
                    const canOpenPopups = await checkPopupPermission();
                    if (!canOpenPopups) {
                        showStatus('Popup permission required for results display', 'error');
                        return;
                    }
                }

                // Get active tab
                const tabs = await queryTabs({ active: true, currentWindow: true });
                const tab = tabs[0];

                // Execute script based on platform and browser
                if (isFirefox) {
                    // Firefox - Manifest V2
                    if (platform === 'traxcn') {
                        await executeScriptFirefox(tab.id, extractTraxcnData);
                    } else {
                        await executeScriptFirefox(tab.id, extractApolloData);
                    }
                } else {
                    // Chrome/Edge - Manifest V3
                    if (platform === 'traxcn') {
                        await api.scripting.executeScript({
                            target: { tabId: tab.id },
                            function: extractTraxcnData
                        });
                    } else {
                        await api.scripting.executeScript({
                            target: { tabId: tab.id },
                            function: extractApolloData
                        });
                    }
                }

                showStatus('Data extraction started! Check the new tab for results.', 'success');
            } catch (error) {
                showStatus('Error: ' + error.message, 'error');
                console.error('Extension error:', error);
            }
        }

        // Helper functions
        async function queryTabs(query) {
            return new Promise((resolve) => {
                api.tabs.query(query, resolve);
            });
        }

        async function executeScriptFirefox(tabId, func) {
            return new Promise((resolve, reject) => {
                api.tabs.executeScript(tabId, {
                    code: `(${func.toString()})()`
                }, (result) => {
                    if (api.runtime.lastError) {
                        reject(api.runtime.lastError);
                    } else {
                        resolve(result);
                    }
                });
            });
        }

        async function checkPopupPermission() {
            return new Promise((resolve) => {
                api.permissions.contains({
                    permissions: ['tabs']
                }, (hasPermission) => {
                    if (hasPermission) {
                        resolve(true);
                    } else {
                        api.permissions.request({
                            permissions: ['tabs']
                        }, (granted) => {
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
            status.className = `status ${type}`;
            status.style.display = 'block';
            
            setTimeout(() => {
                status.style.display = 'none';
            }, 4000);
        }
    });

    // Traxcn extraction function (original)
    function extractTraxcnData() {
        function delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        function createResultsWindow(allData, platform) {
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
            
            let htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>POC Automator - ${platform} Extract Results</title>
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
</head>
<body>
    <div class="container">
        <h1><div class="logo">PA</div>POC Automator - ${platform} Extraction Results</h1>
        <div class="stats"><strong>${allData.length} contacts extracted</strong> from ${platform} profile</div>
        <button class="download-btn" onclick="downloadCSV()">Download CSV</button>
        <button class="download-btn print-btn" onclick="window.print()">Print Results</button>
        <table>
            <thead>
                <tr>
                    <th>POC Role</th>
                    <th>POC Name</th>
                    <th>POC Email</th>
                </tr>
            </thead>
            <tbody>`;

            // Add table rows
            allData.forEach(item => {
                const emailDisplay = item.pocEmail || '<span class="no-email">Email not found</span>';
                htmlContent += `<tr><td>${item.pocRole}</td><td>${item.pocName}</td><td>${emailDisplay}</td></tr>`;
            });

            // Complete the HTML
            htmlContent += `
            </tbody>
        </table>
        <div class="footer">
            <p>Generated by POC Automator on ${new Date().toLocaleString()}</p>
        </div>
    </div>
    <script>
        function downloadCSV() {
            const data = ${JSON.stringify(allData)};
            let csv = "POC Role,POC Name,POC Email\\n";
            data.forEach(row => {
                const role = (row.pocRole || "").replace(/"/g, '""');
                const name = (row.pocName || "").replace(/"/g, '""');
                const email = (row.pocEmail || "").replace(/"/g, '""');
                csv += \`"\${role}","\${name}","\${email}"\\n\`;
            });
            
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'poc-data-${platform.toLowerCase()}-' + new Date().toISOString().split('T')[0] + '.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }
    </script>
</body>
</html>`;

            // Write to new window
            newWindow.document.open();
            newWindow.document.write(htmlContent);
            newWindow.document.close();
        }

        async function extractTableData(tableContainer) {
            const extractedData = [];
            const rows = tableContainer.querySelectorAll('.comp--gridtable__row');
            
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const nameCell = row.querySelector('[data-walk-through-id*="-cell-name"]');
                const designationCell = row.querySelector('[data-walk-through-id*="-cell-designation"]');
                
                if (!nameCell) continue;
                
                let nameText = nameCell.textContent.trim().replace(/^\d+\.\s*/, '');
                nameText = nameText.split('\n')[0].trim();
                const designation = designationCell ? designationCell.textContent.trim() : '';
                
                const emailIcon = nameCell.querySelector('span.fa-envelope');
                let email = '';
                
                if (emailIcon) {
                    const existingDropdowns = document.querySelectorAll('.listDropdown__wrapper');
                    existingDropdowns.forEach(dropdown => {
                        if (dropdown.style.display !== 'none') {
                            dropdown.style.display = 'none';
                        }
                    });
                    
                    emailIcon.click();
                    await delay(500);
                    
                    const emailDropdown = document.querySelector('.listDropdown__wrapper:not([style*="display: none"])');
                    if (emailDropdown) {
                        const emailLink = emailDropdown.querySelector('a[href^="mailto:"]');
                        if (emailLink) {
                            email = emailLink.textContent.trim();
                        }
                    }
                    
                    document.body.click();
                    await delay(200);
                }
                
                extractedData.push({
                    pocRole: designation,
                    pocName: nameText,
                    pocEmail: email
                });
            }
            
            return extractedData;
        }

        (async function() {
            try {
                const targetSections = ["Founders & Key People", "Senior Management"];
                let allData = [];
                const headers = document.querySelectorAll('.txn--dp-subheader');
                
                for (let header of headers) {
                    const sectionTitle = header.textContent.trim();
                    if (targetSections.includes(sectionTitle)) {
                        let tableContainer = header.parentElement.querySelector('.comp--gridtable__wrapper-v2');
                        if (!tableContainer) {
                            const nextDiv = header.parentElement.nextElementSibling;
                            if (nextDiv) {
                                tableContainer = nextDiv.querySelector('.comp--gridtable__wrapper-v2');
                            }
                        }
                        
                        if (tableContainer) {
                            const sectionData = await extractTableData(tableContainer);
                            allData = allData.concat(sectionData);
                        }
                    }
                }
                
                createResultsWindow(allData, 'Traxcn');
                
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred during extraction: ' + error.message);
            }
        })();
    }

    // Apollo extraction function (fixed with alternate role selection)
    function extractApolloData() {
        function createResultsWindow(allData, platform) {
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
            
            let htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>POC Automator - ${platform} Extract Results</title>
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
</head>
<body>
    <div class="container">
        <h1><div class="logo">PA</div>POC Automator - ${platform} Extraction Results</h1>
        <div class="stats"><strong>${allData.length} contacts extracted</strong> from ${platform} profile</div>
        <button class="download-btn" onclick="downloadCSV()">Download CSV</button>
        <button class="download-btn print-btn" onclick="window.print()">Print Results</button>
        <table>
            <thead>
                <tr>
                    <th>POC Role</th>
                    <th>POC Name</th>
                    <th>POC Email</th>
                </tr>
            </thead>
            <tbody>`;

            // Add table rows
            allData.forEach(item => {
                const emailDisplay = item.pocEmail || '<span class="no-email">Email not found</span>';
                htmlContent += `<tr><td>${item.pocRole}</td><td>${item.pocName}</td><td>${emailDisplay}</td></tr>`;
            });

            // Complete the HTML
            htmlContent += `
            </tbody>
        </table>
        <div class="footer">
            <p>Generated by POC Automator on ${new Date().toLocaleString()}</p>
        </div>
    </div>
    <script>
        function downloadCSV() {
            const data = ${JSON.stringify(allData)};
            let csv = "POC Role,POC Name,POC Email\\n";
            data.forEach(row => {
                const role = (row.pocRole || "").replace(/"/g, '""');
                const name = (row.pocName || "").replace(/"/g, '""');
                const email = (row.pocEmail || "").replace(/"/g, '""');
                csv += \`"\${role}","\${name}","\${email}"\\n\`;
            });
            
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'poc-data-${platform.toLowerCase()}-' + new Date().toISOString().split('T')[0] + '.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }
    </script>
</body>
</html>`;

            // Write to new window
            newWindow.document.open();
            newWindow.document.write(htmlContent);
            newWindow.document.close();
        }

        (async function() {
            try {
                let allData = [];
                
                // Get all name elements
                const nameElements = document.querySelectorAll('span.zp_pHNm5');
                // Get all role divs 
                const roleDivs = document.querySelectorAll('div.zp_YGDgt');
                // Get all email elements
                const emailElements = document.querySelectorAll('span.zp_xvo3G.zp_JTaUA');
                
                // Extract only the valid roles (every odd index: 1, 3, 5, etc.)
                const validRoles = [];
                for (let i = 0; i < roleDivs.length; i += 2) {  // Start from index 1, increment by 2
                    const roleSpan = roleDivs[i].querySelector('span.zp_FEm_X');
                    if (roleSpan) {
                        validRoles.push(roleSpan.textContent.trim().replace(/&amp;/g, '&'));
                    } else {
                        validRoles.push('');
                    }
                }
                
                // Process each person
                const maxLength = Math.max(nameElements.length, validRoles.length, emailElements.length);
                
                for (let i = 0; i < maxLength; i++) {
                    const name = nameElements[i] ? nameElements[i].textContent.trim() : '';
                    const role = validRoles[i] || '';
                    const email = emailElements[i] ? emailElements[i].textContent.trim() : '';
                    
                    if (name || role || email) {  // Add if at least one field has data
                        allData.push({
                            pocRole: role,
                            pocName: name,
                            pocEmail: email
                        });
                    }
                }
                
                createResultsWindow(allData, 'Apollo');
                
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred during Apollo extraction: ' + error.message);
            }
        })();
    }
})();