document.addEventListener('DOMContentLoaded', function () {
    const extractBtn = document.getElementById('extractBtn');
    const status = document.getElementById('status');

    extractBtn.addEventListener('click', async function () {
        try {
            // First check if we can open popups, if not request permission
            const canOpenPopups = await checkAndRequestPopupPermission();

            if (!canOpenPopups) {
                showStatus('Popup permission required for results display', 'error');
                return;
            }

            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: extractPOCData
            });

            showStatus('Data extraction started! Check the new tab for results.', 'success');
        } catch (error) {
            showStatus('Error: ' + error.message, 'error');
        }
    });

    // Check and request popup permission
    async function checkAndRequestPopupPermission() {
        return new Promise((resolve) => {
            // First check if we already have tabs permission (which allows us to open popups)
            chrome.permissions.contains({
                permissions: ['tabs']
            }, (hasPermission) => {
                if (hasPermission) {
                    resolve(true);
                } else {
                    // Request permission
                    chrome.permissions.request({
                        permissions: ['tabs']
                    }, (granted) => {
                        if (granted) {
                            showStatus('Permission granted! Click extract again.', 'success');
                            resolve(true);
                        } else {
                            showStatus('Permission denied. Please allow popup access.', 'error');
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

function extractPOCData() {
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
                } else {
                    // Fallback method
                    const visibleEmailLinks = document.querySelectorAll('a[href^="mailto:"]:not([style*="display: none"])');
                    for (let link of visibleEmailLinks) {
                        const rect = link.getBoundingClientRect();
                        if (rect.width > 0 && rect.height > 0) {
                            email = link.textContent.trim();
                            break;
                        }
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

    (async function () {
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

            // Enhanced popup creation with better error handling
            let newWindow = null;
            try {
                newWindow = window.open('', '_blank', 'width=1000,height=600,scrollbars=yes,resizable=yes');
            } catch (e) {
                console.error('Popup blocked:', e);
            }

            if (!newWindow) {
                // Fallback: try to enable popups
                alert('Popup blocked! Please:\n1. Click the popup blocked icon in address bar\n2. Select "Always allow popups from this site"\n3. Try extraction again');

                // Try to guide user to enable popups
                if (confirm('Would you like instructions to enable popups?')) {
                    const instructionWindow = window.open('data:text/html,<h2>Enable Popups Instructions</h2><p>1. Look for popup blocked icon in address bar</p><p>2. Click it and select "Always allow popups"</p><p>3. Return to original page and try again</p>', '_blank');
                }
                return;
            }

            let html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>POC Information Extract</title>
<style>
body{font-family:Arial,sans-serif;margin:20px;background:#f5f5f5}
.container{background:white;padding:20px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1)}
table{border-collapse:collapse;width:100%;margin-top:20px}
th,td{border:1px solid #ddd;padding:12px;text-align:left}
th{background:#1a73e8;color:white;font-weight:bold}
tr:nth-child(even){background:#f9f9f9}
tr:hover{background:#e3f2fd}
h1{color:#333;margin-top:0}
.stats{background:#e8f5e8;padding:10px;border-radius:4px;margin-bottom:20px}
.no-email{color:#999;font-style:italic}
.download-btn{background:#4CAF50;color:white;padding:10px 20px;border:none;border-radius:4px;cursor:pointer;margin:10px 5px 0 0}
.download-btn:hover{background:#45a049}
</style>
</head><body>
<div class="container">
<h1>POC Information Extract</h1>
<div class="stats">📊 Total records found: <strong>${allData.length}</strong></div>
<button class="download-btn" onclick="downloadCSV()">Download CSV</button>
<button class="download-btn" onclick="window.print()">Print</button>
<table id="pocTable">
<thead><tr><th>POC Role</th><th>POC Name</th><th>POC Email</th></tr></thead><tbody>`;

            allData.forEach(item => {
                const emailDisplay = item.pocEmail || '<span class="no-email">Email not found</span>';
                html += `<tr><td>${item.pocRole}</td><td>${item.pocName}</td><td>${emailDisplay}</td></tr>`;
            });

            html += `</tbody></table>
<br><p><small>Generated: ${new Date().toLocaleString()}</small></p>
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
