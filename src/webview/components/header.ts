export function setupRequestHeader(vscode: any, state: any) {
    const headerContainer = document.createElement('div');
    headerContainer.className = 'header-container';
    
    headerContainer.innerHTML = `
      <div class="url-bar">
        <select id="httpMethod" class="method-select">
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="PATCH">PATCH</option>
          <option value="HEAD">HEAD</option>
          <option value="OPTIONS">OPTIONS</option>
        </select>
        <input type="text" id="url" class="url-input" placeholder="Enter request URL" />
      </div>
      <div class="action-buttons">
        <button id="sendButton" class="button">Send</button>
      </div>
    `;
    
    document.getElementById('request-header')?.appendChild(headerContainer);
    
    // Setup event listeners
    const sendButton = document.getElementById('sendButton');
    const httpMethod = document.getElementById('httpMethod') as HTMLSelectElement;
    const urlInput = document.getElementById('url') as HTMLInputElement;
    
    httpMethod?.addEventListener('change', () => {
      window.dispatchEvent(new CustomEvent('request-updated', { detail: state }));
    });
    
    urlInput?.addEventListener('input', () => {
      window.dispatchEvent(new CustomEvent('request-updated', { detail: state }));
    });
    
    sendButton?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('send-request', { detail: state }));
    });
  }