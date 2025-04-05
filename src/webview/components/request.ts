export function setupRequestPanels(vscode: any, state: any) {
  const panelsContainer = document.getElementById('request-panels');
  if (!panelsContainer) {return;}
  
  // Query Parameters Panel
  const queryPanel = document.createElement('div');
  queryPanel.id = 'queryPanel';
  queryPanel.className = 'panel active';
  queryPanel.innerHTML = `
    <h3>Query Parameters</h3>
    <table class="query-params">
      <thead>
        <tr>
          <th width="30px"></th>
          <th>Parameter</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody id="queryParamsList">
        <tr>
          <td><input type="checkbox" checked></td>
          <td><input type="text" placeholder="parameter"></td>
          <td><input type="text" placeholder="value"></td>
        </tr>
      </tbody>
    </table>
    <button id="addParamRow" style="margin-top: 8px;">Add Parameter</button>
  `;
  panelsContainer.appendChild(queryPanel);
  
  // Headers Panel
  const headersPanel = document.createElement('div');
  headersPanel.id = 'headersPanel';
  headersPanel.className = 'panel';
  headersPanel.innerHTML = `
    <h3>Headers</h3>
    <table class="query-params">
      <thead>
        <tr>
          <th width="30px"></th>
          <th>Header</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody id="headersList">
        <tr>
          <td><input type="checkbox" checked></td>
          <td><input type="text" placeholder="header"></td>
          <td><input type="text" placeholder="value"></td>
        </tr>
      </tbody>
    </table>
    <button id="addHeaderRow" style="margin-top: 8px;">Add Header</button>
  `;
  panelsContainer.appendChild(headersPanel);
  
  // Auth Panel
  const authPanel = document.createElement('div');
  authPanel.id = 'authPanel';
  authPanel.className = 'panel';
  authPanel.innerHTML = `
    <h3>Authentication</h3>
    <div>
      <label for="authType">Type:</label>
      <select id="authType">
        <option value="none">None</option>
        <option value="basic">Basic Auth</option>
        <option value="bearer">Bearer Token</option>
        <option value="apikey">API Key</option>
      </select>
    </div>
    <div id="authDetails"></div>
  `;
  panelsContainer.appendChild(authPanel);
  
  // Body Panel
  const bodyPanel = document.createElement('div');
  bodyPanel.id = 'bodyPanel';
  bodyPanel.className = 'panel';
  bodyPanel.innerHTML = `
    <h3>Request Body</h3>
    <div>
      <select id="bodyType">
        <option value="none">None</option>
        <option value="json">JSON</option>
        <option value="form">Form Data</option>
        <option value="text">Text</option>
      </select>
    </div>
    <div id="bodyEditor">
      <textarea id="bodyContent" style="width: 100%; height: 200px; margin-top: 10px;"></textarea>
    </div>
  `;
  panelsContainer.appendChild(bodyPanel);
  
  // Tests Panel
  const testsPanel = document.createElement('div');
  testsPanel.id = 'testsPanel';
  testsPanel.className = 'panel';
  testsPanel.innerHTML = `
    <h3>Tests</h3>
    <p>Write test scripts to validate your API responses.</p>
    <textarea id="testsContent" style="width: 100%; height: 200px;"></textarea>
  `;
  panelsContainer.appendChild(testsPanel);
  
  // Pre Run Panel
  const prerunPanel = document.createElement('div');
  prerunPanel.id = 'prerunPanel';
  prerunPanel.className = 'panel';
  prerunPanel.innerHTML = `
    <h3>Pre Run Script</h3>
    <p>Write scripts to execute before the request is sent.</p>
    <textarea id="prerunContent" style="width: 100%; height: 200px;"></textarea>
  `;
  panelsContainer.appendChild(prerunPanel);
  
  // Setup event listeners for adding rows
  document.getElementById('addParamRow')?.addEventListener('click', () => {
    const tbody = document.getElementById('queryParamsList');
    if (tbody) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><input type="checkbox" checked></td>
        <td><input type="text" placeholder="parameter"></td>
        <td><input type="text" placeholder="value"></td>
      `;
      tbody.appendChild(row);
      
      // Add change listener for new fields
      row.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', () => {
          window.dispatchEvent(new CustomEvent('request-updated', { detail: state }));
        });
      });
    }
  });
  
  document.getElementById('addHeaderRow')?.addEventListener('click', () => {
    const tbody = document.getElementById('headersList');
    if (tbody) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><input type="checkbox" checked></td>
        <td><input type="text" placeholder="header"></td>
        <td><input type="text" placeholder="value"></td>
      `;
      tbody.appendChild(row);
      
      // Add change listener for new fields
      row.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', () => {
          window.dispatchEvent(new CustomEvent('request-updated', { detail: state }));
        });
      });
    }
  });
}