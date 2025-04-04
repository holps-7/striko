import * as vscode from 'vscode';
import { HttpClient } from '../utils/httpClient';
import { StorageProvider } from './storageProvider';
import { Request } from '../models/request';
import { v4 as uuidv4 } from 'uuid';
import { ActivityProvider } from './activityProvider';

export class WebviewProvider {
  private _panel?: vscode.WebviewPanel;
  private _httpClient: HttpClient;
  private _storageProvider: StorageProvider;
  private _activityProvider: ActivityProvider;
  private _currentRequest?: Request;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    storageProvider: StorageProvider,
    activityProvider: ActivityProvider
  ) {
    this._httpClient = new HttpClient();
    this._storageProvider = storageProvider;
    this._activityProvider = activityProvider;
  }

  public createOrShowPanel() {
    const columnToShowIn = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it
    if (this._panel) {
      this._panel.reveal(columnToShowIn);
      return;
    }

    // Otherwise, create a new panel
    this._panel = vscode.window.createWebviewPanel(
      'striko.requestView',
      'Striko API Client',
      columnToShowIn || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [this._extensionUri],
        retainContextWhenHidden: true
      }
    );

    // Set the webview's html content
    this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'sendRequest':
          const response = await this._httpClient.sendRequest(message.request);
          this._currentRequest = message.request;
          // Add to activity history
          this._activityProvider.addRequest(message.request);
          this._panel?.webview.postMessage({ command: 'receiveResponse', response });
          break;
        case 'getCollections':
          const collections = await this._storageProvider.getAllCollections();
          this._panel?.webview.postMessage({ command: 'receiveCollections', collections });
          break;
        case 'getEnvironments':
          const environments = await this._storageProvider.getAllEnvironments();
          this._panel?.webview.postMessage({ command: 'receiveEnvironments', environments });
          break;
        case 'saveCollection':
          await this._storageProvider.saveCollection(message.collection);
          vscode.commands.executeCommand('striko.refreshCollections');
          break;
        case 'saveEnvironment':
          await this._storageProvider.saveEnvironment(message.environment);
          vscode.commands.executeCommand('striko.refreshEnvironments');
          break;
        case 'saveRequest':
          vscode.commands.executeCommand('striko.saveRequest');
          break;
        case 'requestUpdated':
          this._currentRequest = message.request;
          // Add to activity when request is updated via keyboard shortcut
          if (message.saveToActivity && message.request.url) {
            console.log('Saving to activity via keyboard shortcut');
            this._activityProvider.addRequest(message.request);
          }
          break;
        case 'saveToActivity':
          // Directly save to activity - new dedicated message
          if (message.request && message.request.url) {
            console.log('Directly saving to activity');
            this._activityProvider.addRequest(message.request);
          }
          break;
      }
    });

    // Reset when the panel is closed
    this._panel.onDidDispose(
      () => {
        this._panel = undefined;
      },
      null,
      []
    );
  }

  public loadRequest(request: Request) {
    if (this._panel) {
      this._currentRequest = request;
      this._panel.webview.postMessage({ command: 'loadRequest', request });
      
      // Add the request to activity when loaded
      if (request.url) {
        this._activityProvider.addRequest(request);
      }
    }
  }

  public createNewRequest() {
    if (this._panel) {
      const newRequest: Request = {
        id: uuidv4(),
        name: 'New Request',
        url: '',
        method: 'GET',
        headers: {},
        params: {},
        bodyType: 'none'
      };
      
      this._currentRequest = newRequest;
      this._panel.webview.postMessage({ command: 'loadRequest', request: newRequest });
    }
  }

  public async getCurrentRequest(): Promise<Request | undefined> {
    return this._currentRequest;
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Striko API Client</title>
        <style>
          :root {
            --bg-color: var(--vscode-editor-background);
            --text-color: var(--vscode-editor-foreground);
            --border-color: var(--vscode-panel-border);
            --input-bg: var(--vscode-input-background);
            --input-fg: var(--vscode-input-foreground);
            --button-bg: var(--vscode-button-background);
            --button-fg: var(--vscode-button-foreground);
            --button-hover-bg: var(--vscode-button-hoverBackground);
            --tab-active-bg: var(--vscode-tab-activeBackground);
            --tab-inactive-bg: var(--vscode-tab-inactiveBackground);
            --tab-active-fg: var(--vscode-tab-activeForeground);
            --tab-inactive-fg: var(--vscode-tab-inactiveForeground);
          }
          
          body {
            background-color: var(--bg-color);
            color: var(--text-color);
            font-family: var(--vscode-font-family);
            padding: 0;
            margin: 0;
            overflow: hidden;
            height: 100vh;
            display: flex;
            flex-direction: column;
          }
          
          .main-container {
            display: flex;
            flex-direction: column;
            height: 100%;
          }
          
          .header-container {
            display: flex;
            align-items: stretch;
            padding: 0;
            margin: 15px;
            border: 1px solid #555;
            background-color: #1e1e1e;
          }
          
          .url-bar {
            display: flex;
            flex: 1;
          }
          
          .method-select {
            width: 80px;
            background-color: transparent;
            color: #fff;
            border: none;
            border-right: 1px solid #555;
            padding: 8px;
            cursor: pointer;
            outline: none;
          }
          
          .method-select:focus {
            box-shadow: 0 0 0 2px rgba(30, 136, 229, 0.4) inset;
          }
          
          .url-input {
            flex: 1;
            background-color: transparent;
            color: #fff;
            border: 1px solid #555;
            padding: 8px;
            outline: none;
            transition: border-color 0.3s ease;
          }
          
          .url-input:focus {
            box-shadow: 0 0 0 2px rgba(30, 136, 229, 0.4) inset;
            border-color: #fff;
          }
          
          .action-buttons {
            display: flex;
          }
          
          .button {
            background-color: #1e88e5;
            color: white;
            border: none;
            padding: 8px 20px;
            cursor: pointer;
          }
          
          .button:hover {
            background-color: var(--button-hover-bg);
          }
          
          .status-bar {
            padding: 8px;
            border-bottom: 1px solid var(--border-color);
          }
          
          .request-info {
            display: flex;
          }
          
          .info-item {
            margin-right: 16px;
            display: flex;
            align-items: center;
          }
          
          /* Side by side layout */
          .content-container {
            display: flex;
            flex: 1;
            overflow: hidden;
          }
          
          .request-container {
            width: 50%;
            display: flex;
            flex-direction: column;
            border-right: 1px solid var(--border-color);
          }
          
          .response-container {
            width: 50%;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }
          
          .tabs-container {
            display: flex;
            border-bottom: 1px solid var(--border-color);
          }
          
          .tab-section {
            flex: 1;
          }
          
          .tabs {
            display: flex;
          }
          
          .tab {
            padding: 8px 16px;
            cursor: pointer;
            border-bottom: 2px solid transparent;
          }
          
          .tab.active {
            background-color: var(--tab-active-bg);
            color: var(--tab-active-fg);
            border-bottom: 2px solid var(--button-bg);
          }
          
          .tab:not(.active) {
            background-color: var(--tab-inactive-bg);
            color: var(--tab-inactive-fg);
          }
          
          .panels-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }
          
          .panel {
            display: none;
            padding: 16px;
            height: 100%;
            overflow: auto;
          }
          
          .panel.active {
            display: block;
          }
          
          .query-params {
            width: 100%;
            border-collapse: collapse;
          }
          
          .query-params th, .query-params td {
            text-align: left;
            padding: 8px;
            border-bottom: 1px solid var(--border-color);
          }
          
          .query-params input[type="checkbox"] {
            margin: 0;
          }
          
          .query-params input[type="text"] {
            width: 100%;
            background-color: var(--input-bg);
            color: var(--input-fg);
            border: 1px solid var(--border-color);
            padding: 4px 8px;
          }
          
          .response-tabs {
            display: flex;
          }
          
          .response-panel {
            flex: 1;
            padding: 16px;
            display: none;
            overflow: auto;
          }
          
          .response-panel.active {
            display: block;
          }
          
          pre {
            margin: 0;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          
          .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            margin-left: 4px;
          }
          
          textarea {
            background-color: var(--input-bg);
            color: var(--input-fg);
            border: 1px solid var(--border-color);
            padding: 8px;
            resize: vertical;
          }
          
          select {
            background-color: var(--input-bg);
            color: var(--input-fg);
            border: 1px solid var(--border-color);
            padding: 4px;
          }
          
          /* Keyboard shortcut tooltip */
          .shortcut-hint {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--input-bg);
            border: 1px solid var(--border-color);
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            opacity: 0.8;
            z-index: 1000;
          }
          
          .shortcut-hint kbd {
            background: var(--button-bg);
            color: var(--button-fg);
            padding: 2px 5px;
            border-radius: 3px;
            margin: 0 3px;
          }
          
          /* Toast notification */
          .toast {
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: var(--button-bg);
            color: var(--button-fg);
            padding: 10px 15px;
            border-radius: 4px;
            z-index: 1000;
            display: none;
            animation: fadeIn 0.3s, fadeOut 0.3s 1.7s;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
          }
          
          /* Resizer */
          .resizer {
            width: 5px;
            cursor: col-resize;
            background-color: var(--border-color);
          }
          .resizer:hover {
            background-color: var(--button-bg);
          }
        </style>
      </head>
      <body>
        <div class="main-container">
          <!-- Side by side layout -->
          <div class="content-container">
            <!-- Request side -->
            <div class="request-container">
              <div class="header-container">
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
              </div>
              
              <div class="tabs-container">
                <div class="tab-section">
                  <div class="tabs">
                    <div class="tab active" data-tab="query">Query</div>
                    <div class="tab" data-tab="headers">Headers</div>
                    <div class="tab" data-tab="auth">Auth</div>
                    <div class="tab" data-tab="body">Body</div>
                    <div class="tab" data-tab="tests">Tests</div>
                    <div class="tab" data-tab="prerun">Pre Run</div>
                  </div>
                </div>
              </div>
              
              <div class="panels-container">
                <div id="queryPanel" class="panel active">
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
                </div>
                
                <div id="headersPanel" class="panel">
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
                </div>
                
                <div id="authPanel" class="panel">
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
                </div>
                
                <div id="bodyPanel" class="panel">
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
                </div>
                
                <div id="testsPanel" class="panel">
                  <h3>Tests</h3>
                  <p>Write test scripts to validate your API responses.</p>
                  <textarea id="testsContent" style="width: 100%; height: 200px;"></textarea>
                </div>
                
                <div id="prerunPanel" class="panel">
                  <h3>Pre Run Script</h3>
                  <p>Write scripts to execute before the request is sent.</p>
                  <textarea id="prerunContent" style="width: 100%; height: 200px;"></textarea>
                </div>
              </div>
            </div>
            
            <!-- Resizer -->
            <div class="resizer" id="resizer"></div>
            
            <!-- Response side -->
            <div class="response-container">
              <div class="status-bar">
                <div class="request-info">
                  <div class="info-item">Status: <span id="statusValue"></span></div>
                  <div class="info-item">Size: <span id="sizeValue"></span></div>
                  <div class="info-item">Time: <span id="timeValue"></span></div>
                </div>
              </div>
              <div class="tabs-container">
                <div class="tab-section">
                  <div class="tabs">
                    <div class="tab active" data-tab="response">Response</div>
                    <div class="tab" data-tab="responseHeaders">Headers</div>
                    <div class="tab" data-tab="cookies">Cookies</div>
                    <div class="tab" data-tab="results">Results</div>
                  </div>
                </div>
              </div>
              
              <div class="panels-container">
                <div id="responsePanel" class="response-panel active">
                  <pre id="responseBody"></pre>
                </div>
                
                <div id="responseHeadersPanel" class="response-panel">
                  <div id="responseHeadersList"></div>
                </div>
                
                <div id="cookiesPanel" class="response-panel">
                  <p>No cookies found in the response.</p>
                </div>
                
                <div id="resultsPanel" class="response-panel">
                  <p>Test results will appear here after running tests.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Shortcut hint -->
        <div class="shortcut-hint">
          Save to Activity: <kbd>Ctrl</kbd>+<kbd>S</kbd> or <kbd>⌘</kbd>+<kbd>S</kbd>
        </div>
        
        <!-- Toast notification -->
        <div class="toast" id="saveToast">Request saved to Activity</div>
        
        <script>
          (function() {
            const vscode = acquireVsCodeApi();
            let currentRequest = {
              id: crypto.randomUUID(),
              name: 'New Request',
              method: 'GET',
              url: '',
              headers: {},
              params: {},
              auth: { type: 'none' },
              bodyType: 'none'
            };
            
            // Initialize tabs functionality
            document.querySelectorAll('.tab').forEach(tab => {
              tab.addEventListener('click', () => {
                const tabSection = tab.closest('.tab-section');
                const targetTab = tab.dataset.tab;
                
                // Deactivate all tabs in this section
                tabSection.querySelectorAll('.tab').forEach(t => {
                  t.classList.remove('active');
                });
                
                // Activate clicked tab
                tab.classList.add('active');
                
                // Find the relevant panels container
                const panelsContainer = tab.closest('.tabs-container').nextElementSibling;
                
                // Hide all panels
                panelsContainer.querySelectorAll('.panel, .response-panel').forEach(panel => {
                  panel.classList.remove('active');
                });
                
                // Show the corresponding panel
                const panelId = targetTab + 'Panel';
                const panel = document.getElementById(panelId);
                if (panel) {
                  panel.classList.add('active');
                }
              });
            });
            
            // Initialize the resizer
            const resizer = document.getElementById('resizer');
            const requestContainer = document.querySelector('.request-container');
            const responseContainer = document.querySelector('.response-container');
            
            let x = 0;
            let requestWidth = 0;
            
            const mouseDownHandler = function(e) {
              x = e.clientX;
              requestWidth = requestContainer.getBoundingClientRect().width;
              
              document.addEventListener('mousemove', mouseMoveHandler);
              document.addEventListener('mouseup', mouseUpHandler);
            };
            
            const mouseMoveHandler = function(e) {
              const dx = e.clientX - x;
              const newWidth = ((requestWidth + dx) / requestContainer.parentNode.getBoundingClientRect().width) * 100;
              
              requestContainer.style.width = newWidth + '%';
              responseContainer.style.width = (100 - newWidth) + '%';
            };
            
            const mouseUpHandler = function() {
              document.removeEventListener('mousemove', mouseMoveHandler);
              document.removeEventListener('mouseup', mouseUpHandler);
            };
            
            resizer.addEventListener('mousedown', mouseDownHandler);
            
            // Initialize send button
            const sendButton = document.getElementById('sendButton');
            const urlInput = document.getElementById('url');
            const httpMethod = document.getElementById('httpMethod');
            const saveToast = document.getElementById('saveToast');
            
            // Update current request when inputs change
            httpMethod.addEventListener('change', () => updateCurrentRequest());
            urlInput.addEventListener('input', () => updateCurrentRequest());
            
            function generateRequestName(method, url) {
              // Extract domain and path from URL
              try {
                const urlObj = new URL(url);
                // Generate name based on method and URL path
                return method + ' ' + (urlObj.pathname || '/');
              } catch (e) {
                // If URL parsing fails (incomplete URL), use what we have
                return method + ' ' + (url ? url : 'New Request');
              }
            }
            
            function updateCurrentRequest(saveToActivity = false) {
              const method = httpMethod.value;
              const url = urlInput.value;
              
              // Auto-generate name from method and URL
              currentRequest.name = generateRequestName(method, url);
              currentRequest.method = method;
              currentRequest.url = url;
              
              // Collect headers
              currentRequest.headers = {};
              document.querySelectorAll('#headersList tr').forEach(row => {
                const enabled = row.querySelector('input[type="checkbox"]').checked;
                if (enabled) {
                  const key = row.querySelectorAll('input[type="text"]')[0].value;
                  const value = row.querySelectorAll('input[type="text"]')[1].value;
                  if (key) {
                    currentRequest.headers[key] = value;
                  }
                }
              });
              
              // Collect query parameters
              currentRequest.params = {};
              document.querySelectorAll('#queryParamsList tr').forEach(row => {
                const enabled = row.querySelector('input[type="checkbox"]').checked;
                if (enabled) {
                  const key = row.querySelectorAll('input[type="text"]')[0].value;
                  const value = row.querySelectorAll('input[type="text"]')[1].value;
                  if (key) {
                    currentRequest.params[key] = value;
                  }
                }
              });
              
              // Get body
              const bodyType = document.getElementById('bodyType').value;
              const bodyContent = document.getElementById('bodyContent').value;
              currentRequest.bodyType = bodyType;
              
              if (bodyType === 'json' && bodyContent) {
                try {
                  currentRequest.body = JSON.parse(bodyContent);
                } catch (e) {
                  // Invalid JSON - don't update body
                }
              } else if (bodyContent && bodyType !== 'none') {
                currentRequest.body = bodyContent;
              } else {
                currentRequest.body = null;
              }
              
              // Get auth
              const authType = document.getElementById('authType').value;
              currentRequest.auth = { type: authType };
              
              if (authType !== 'none') {
                currentRequest.auth.credentials = {};
                
                if (authType === 'basic') {
                  const username = document.getElementById('basicUsername')?.value;
                  const password = document.getElementById('basicPassword')?.value;
                  if (username) currentRequest.auth.credentials.username = username;
                  if (password) currentRequest.auth.credentials.password = password;
                }
                else if (authType === 'bearer') {
                  const token = document.getElementById('bearerToken')?.value;
                  if (token) currentRequest.auth.credentials.token = token;
                }
                else if (authType === 'apikey') {
                  const key = document.getElementById('apiKeyName')?.value;
                  const value = document.getElementById('apiKeyValue')?.value;
                  const location = document.getElementById('apiKeyLocation')?.value;
                  if (key) currentRequest.auth.credentials.key = key;
                  if (value) currentRequest.auth.credentials.value = value;
                  if (location) currentRequest.auth.credentials.location = location;
                }
              }
              
              // Get tests and pre-run script
              currentRequest.tests = document.getElementById('testsContent').value;
              currentRequest.preRun = document.getElementById('prerunContent').value;
              
              // Notify extension of updated request
              vscode.postMessage({
                command: 'requestUpdated',
                request: currentRequest,
                saveToActivity: saveToActivity
              });
            }
            
            // Show toast notification
            function showToast() {
              saveToast.style.display = 'block';
              
              setTimeout(() => {
                saveToast.style.display = 'none';
              }, 2000);
            }
            
            // Add send button event listener
            sendButton.addEventListener('click', () => {
              // Update request with latest form values
              updateCurrentRequest();
              
              // Basic validation
              if (!currentRequest.url) {
                // Show error if URL is empty
                vscode.postMessage({ 
                  command: 'showErrorMessage', 
                  message: 'Please enter a URL' 
                });
                return;
              }
              
              // Send the request to the extension
              vscode.postMessage({
                command: 'sendRequest',
                request: currentRequest
              });
            });
            
            // Handle messages from the extension
            window.addEventListener('message', event => {
              const message = event.data;
              
              if (message.command === 'receiveResponse') {
                // Display response data
                const response = message.response;
                
                // Update status bar
                document.getElementById('statusValue').textContent = \`\${response.status} \${response.statusText}\`;
                document.getElementById('sizeValue').textContent = \`\${formatBytes(response.size)}\`;
                document.getElementById('timeValue').textContent = \`\${response.time}ms\`;
                
                // Update response body
                const responseBody = document.getElementById('responseBody');
                
                if (typeof response.data === 'object') {
                  responseBody.textContent = JSON.stringify(response.data, null, 2);
                } else {
                  responseBody.textContent = response.data;
                }
                
                // Update response headers
                const headersList = document.getElementById('responseHeadersList');
                let headersHTML = '<div style="white-space: pre-wrap;">';
                
                for (const key in response.headers) {
                  headersHTML += \`<div><strong>\${key}:</strong> \${response.headers[key]}</div>\`;
                }
                
                headersHTML += '</div>';
                headersList.innerHTML = headersHTML;
              }
              else if (message.command === 'loadRequest') {
                // Load request data into UI
                const request = message.request;
                currentRequest = request;
                
                // Update method and URL
                httpMethod.value = request.method;
                urlInput.value = request.url;
                
                // More loading logic can be added here
              }
            });
            
            // Helper function to format bytes
            function formatBytes(bytes, decimals = 2) {
              if (bytes === 0) return '0 Bytes';
              
              const k = 1024;
              const dm = decimals < 0 ? 0 : decimals;
              const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
              
              const i = Math.floor(Math.log(bytes) / Math.log(k));
              
              return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
            }
            
            // Keyboard shortcuts
            document.addEventListener('keydown', event => {
              // Ctrl+S or Cmd+S to save to activity
              if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault();
                
                if (currentRequest.url) {
                  updateCurrentRequest(true); // Update with saveToActivity flag
                  showToast();
                }
              }
              
              // Ctrl+Enter or Cmd+Enter to send request
              if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                event.preventDefault();
                sendButton.click();
              }
            });
          })();
        </script>
      </body>
      </html>
    `;
  }
}