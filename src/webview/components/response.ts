export function setupResponsePanels() {
    const panelsContainer = document.getElementById('response-panels');
    if (!panelsContainer) {return;}

    // Status bar
    const statusBar = document.createElement('div');
    statusBar.className = 'status-bar';
    statusBar.innerHTML = `
        <div class="request-info">
        <div class="info-item">Status: <span id="statusValue"></span></div>
        <div class="info-item">Size: <span id="sizeValue"></span></div>
        <div class="info-item">Time: <span id="timeValue"></span></div>
        </div>
    `;
    document.getElementById('response-status')?.appendChild(statusBar);

    // Response body panel
    const responsePanel = document.createElement('div');
    responsePanel.id = 'responsePanel';
    responsePanel.className = 'response-panel active';
    responsePanel.innerHTML = `<pre id="responseBody"></pre>`;
    panelsContainer.appendChild(responsePanel);

    // Response headers panel
    const headersPanel = document.createElement('div');
    headersPanel.id = 'responseHeadersPanel';
    headersPanel.className = 'response-panel';
    headersPanel.innerHTML = `<div id="responseHeadersList"></div>`;
    panelsContainer.appendChild(headersPanel);

    // Cookies panel
    const cookiesPanel = document.createElement('div');
    cookiesPanel.id = 'cookiesPanel';
    cookiesPanel.className = 'response-panel';
    cookiesPanel.innerHTML = `<p>No cookies found in the response.</p>`;
    panelsContainer.appendChild(cookiesPanel);

    // Test results panel
    const resultsPanel = document.createElement('div');
    resultsPanel.id = 'resultsPanel';
    resultsPanel.className = 'response-panel';
    resultsPanel.innerHTML = `<p>Test results will appear here after running tests.</p>`;
    panelsContainer.appendChild(resultsPanel);
}