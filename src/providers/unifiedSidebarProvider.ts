import * as vscode from 'vscode';
import { ActivityProvider } from './activityProvider';
import { CollectionsProvider } from './collectionsProvider';
import { EnvironmentsProvider } from './environmentsProvider';
import { StorageProvider } from './storageProvider';

export class UnifiedSidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'striko.sidebarView';

  private _view?: vscode.WebviewView;
  private _activityProvider: ActivityProvider;
  private _collectionsProvider: CollectionsProvider;
  private _environmentsProvider: EnvironmentsProvider;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _storageProvider: StorageProvider,
    activityProvider?: ActivityProvider // Make this parameter optional
  ) {
    // Use the provided activity provider or create a new one
    this._activityProvider = activityProvider || new ActivityProvider();
    this._collectionsProvider = new CollectionsProvider(_storageProvider);
    this._environmentsProvider = new EnvironmentsProvider(_storageProvider);
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Initialize with data
    this._refreshData();

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case 'newRequest': {
          vscode.commands.executeCommand('striko.newRequest');
          break;
        }
        case 'openRequest': {
          vscode.commands.executeCommand('striko.openRequest', data.request);
          break;
        }
        case 'runRequest': {
          vscode.commands.executeCommand('striko.openRequest', data.request);
          break;
        }
        case 'saveToCollection': {
          vscode.commands.executeCommand('striko.openRequest', data.request);
          setTimeout(() => {
            vscode.commands.executeCommand('striko.saveRequest');
          }, 300);
          break;
        }
        case 'deleteRequest': {
          if (data.source === 'activity') {
            this._activityProvider.removeRequest(data.requestId);
            this._refreshData();
          }
          break;
        }
        case 'refresh': {
          this._refreshData();
          break;
        }
      }
    });
  }

  private async _refreshData() {
    if (!this._view) {
      return;
    }

    // Get all data
    const activities = this._activityProvider.getRecentRequests();
    const collections = await this._storageProvider.getAllCollections();
    const environments = await this._storageProvider.getAllEnvironments();

    // Send to webview
    this._view.webview.postMessage({
      type: 'setData',
      activities,
      collections,
      environments
    });
  }

  public refreshActivity() {
    if (this._view) {
      this._refreshData();
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Striko Sidebar</title>
        <style>
          body {
            background-color: var(--vscode-sideBar-background);
            color: var(--vscode-sideBar-foreground);
            font-family: var(--vscode-font-family);
            padding: 0;
            margin: 0;
            font-size: 13px;
          }
          
          .new-request-button {
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 2px;
            padding: 8px;
            margin: 8px;
            cursor: pointer;
            font-size: 13px;
            width: calc(100% - 16px);
          }
          
          .new-request-button:hover {
            background-color: var(--vscode-button-hoverBackground);
          }
          
          .tabs {
            display: flex;
            border-bottom: 1px solid var(--vscode-panel-border);
          }
          
          .tab {
            padding: 8px 12px;
            cursor: pointer;
            border-bottom: 2px solid transparent;
            flex: 1;
            text-align: center;
            opacity: 0.8;
          }
          
          .tab.active {
            border-bottom-color: var(--vscode-focusBorder);
            opacity: 1;
          }
          
          .tab:hover:not(.active) {
            opacity: 0.9;
            background-color: var(--vscode-list-hoverBackground);
          }
          
          .content {
            height: calc(100vh - 80px);
            overflow-y: auto;
          }
          
          .panel {
            display: none;
          }
          
          .panel.active {
            display: block;
          }
          
          .search-box {
            margin: 8px;
            position: relative;
          }
          
          .search-input {
            width: 100%;
            padding: 5px 10px;
            padding-right: 30px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border, transparent);
            border-radius: 2px;
            font-size: 12px;
            box-sizing: border-box;
          }
          
          .search-icon {
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            opacity: 0.6;
          }
          
          .activity-item {
            position: relative;
            padding: 8px 12px;
            border-bottom: 1px solid var(--vscode-panel-border);
            cursor: pointer;
            overflow: hidden;
          }
          
          .activity-item:hover {
            background-color: var(--vscode-list-hoverBackground);
          }
          
          .method-badge {
            display: inline-block;
            padding: 2px 6px;
            margin-right: 8px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: bold;
            text-align: center;
            min-width: 40px;
            color: #fff;
          }
          
          .method-get { background-color: #61affe; }
          .method-post { background-color: #49cc90; }
          .method-put { background-color: #fca130; }
          .method-delete { background-color: #f93e3e; }
          .method-patch { background-color: #50e3c2; }
          .method-head, .method-options { background-color: #9012fe; }
          
          .activity-path {
            display: inline-block;
            vertical-align: middle;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: calc(100% - 60px);
          }
          
          .activity-time {
            font-size: 11px;
            opacity: 0.6;
            margin-top: 2px;
          }
          
          .empty-state {
            padding: 16px;
            text-align: center;
            opacity: 0.7;
          }
          
          .collection-header {
            padding: 8px 12px;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid var(--vscode-panel-border);
          }
          
          .collection-header:hover {
            background-color: var(--vscode-list-hoverBackground);
          }
          
          .collection-items {
            display: none;
          }
          
          .collection-items.expanded {
            display: block;
          }
          
          /* Context menu */
          .context-menu {
            position: fixed;
            background-color: var(--vscode-menu-background);
            color: var(--vscode-menu-foreground);
            border: 1px solid var(--vscode-menu-border);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            border-radius: 3px;
            padding: 4px 0;
            min-width: 160px;
            z-index: 1000;
          }
          
          .context-menu-item {
            padding: 6px 12px;
            cursor: pointer;
          }
          
          .context-menu-item:hover {
            background-color: var(--vscode-menu-selectionBackground);
            color: var(--vscode-menu-selectionForeground);
          }
          
          .context-menu-separator {
            height: 1px;
            background-color: var(--vscode-menu-separatorBackground);
            margin: 4px 0;
          }
        </style>
      </head>
      <body>
        <button class="new-request-button" id="newRequestBtn">New Request</button>
        
        <div class="tabs">
          <div class="tab active" id="activityTab">Activity</div>
          <div class="tab" id="collectionsTab">Collections</div>
          <div class="tab" id="environmentsTab">Env</div>
        </div>
        
        <div class="content">
          <!-- Activity Panel -->
          <div class="panel active" id="activityPanel">
            <div class="search-box">
              <input type="text" class="search-input" id="activitySearch" placeholder="filter activity">
              <span class="search-icon">🔍</span>
            </div>
            <div id="activityList"></div>
          </div>
          
          <!-- Collections Panel -->
          <div class="panel" id="collectionsPanel">
            <div id="collectionsList"></div>
          </div>
          
          <!-- Environments Panel -->
          <div class="panel" id="environmentsPanel">
            <div id="environmentsList"></div>
          </div>
        </div>
        
        <!-- Context Menu -->
        <div class="context-menu" id="contextMenu" style="display: none;"></div>
        
        <script>
          (function() {
            const vscode = acquireVsCodeApi();
            
            // Initialize active tab
            let activeTab = 'activity';
            
            // Data storage
            let activities = [];
            let collections = [];
            let environments = [];
            
            // Context menu
            const contextMenu = document.getElementById('contextMenu');
            let currentContextRequest = null;
            
            // Hide context menu when clicking outside
            document.addEventListener('click', (e) => {
              if (!contextMenu.contains(e.target)) {
                contextMenu.style.display = 'none';
              }
            });
            
            // New request button
            document.getElementById('newRequestBtn').addEventListener('click', () => {
              vscode.postMessage({ type: 'newRequest' });
            });
            
            // Activity search
            const activitySearch = document.getElementById('activitySearch');
            activitySearch.addEventListener('input', () => {
              renderActivities(activitySearch.value.toLowerCase());
            });
            
            // Tab switching
            document.getElementById('activityTab').addEventListener('click', () => {
              setActiveTab('activity');
            });
            
            document.getElementById('collectionsTab').addEventListener('click', () => {
              setActiveTab('collections');
            });
            
            document.getElementById('environmentsTab').addEventListener('click', () => {
              setActiveTab('environments');
            });
            
            function setActiveTab(tab) {
              if (tab === activeTab) return;
              
              // Update UI
              document.querySelector('.tab.active').classList.remove('active');
              document.getElementById(tab + 'Tab').classList.add('active');
              
              // Hide all panels
              document.querySelectorAll('.panel').forEach(panel => {
                panel.classList.remove('active');
              });
              
              // Show selected panel
              document.getElementById(tab + 'Panel').classList.add('active');
              
              // Update active tab
              activeTab = tab;
            }
            
            // Format the path from a URL - removing protocol, domain, query params
            function formatPath(url) {
              try {
                const urlObj = new URL(url);
                return urlObj.host + urlObj.pathname;
              } catch (e) {
                // If URL is invalid, just return it as is
                return url;
              }
            }
            
            // Format the relative time
            function formatRelativeTime(timestamp) {
              // If timestamp is not a number, assume it's a Date string
              const time = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
              const now = Date.now();
              const diffMinutes = Math.floor((now - time) / (1000 * 60));
              
              if (diffMinutes < 1) {
                return 'just now';
              } else if (diffMinutes < 60) {
                return \`\${diffMinutes} min\${diffMinutes === 1 ? '' : 's'} ago\`;
              } else if (diffMinutes < 1440) { // less than a day
                const hours = Math.floor(diffMinutes / 60);
                return \`\${hours} hour\${hours === 1 ? '' : 's'} ago\`;
              } else {
                const days = Math.floor(diffMinutes / 1440);
                return \`\${days} day\${days === 1 ? '' : 's'} ago\`;
              }
            }
            
            // Show context menu
            function showContextMenu(request, x, y) {
              currentContextRequest = request;
              
              const menuItems = [
                { label: 'Run Request', action: 'runRequest' },
                { label: 'Save to Collection', action: 'saveToCollection' },
                { label: 'Open in New Tab', action: 'openRequest' },
                { separator: true },
                { label: 'Rename', action: 'rename' },
                { label: 'Duplicate', action: 'duplicate' },
                { separator: true },
                { label: 'Delete', action: 'delete' }
              ];
              
              contextMenu.innerHTML = '';
              
              menuItems.forEach(item => {
                if (item.separator) {
                  const separator = document.createElement('div');
                  separator.className = 'context-menu-separator';
                  contextMenu.appendChild(separator);
                } else {
                  const menuItem = document.createElement('div');
                  menuItem.className = 'context-menu-item';
                  menuItem.textContent = item.label;
                  menuItem.addEventListener('click', () => {
                    handleContextMenuAction(item.action, request);
                    contextMenu.style.display = 'none';
                  });
                  contextMenu.appendChild(menuItem);
                }
              });
              
              // Position menu
              contextMenu.style.left = \`\${x}px\`;
              contextMenu.style.top = \`\${y}px\`;
              contextMenu.style.display = 'block';
              
              // Adjust position if menu goes off screen
              const rect = contextMenu.getBoundingClientRect();
              const windowWidth = window.innerWidth;
              const windowHeight = window.innerHeight;
              
              if (rect.right > windowWidth) {
                contextMenu.style.left = \`\${windowWidth - rect.width}px\`;
              }
              
              if (rect.bottom > windowHeight) {
                contextMenu.style.top = \`\${y - rect.height}px\`;
              }
            }
            
            // Handle context menu actions
            function handleContextMenuAction(action, request) {
              switch (action) {
                case 'runRequest':
                  vscode.postMessage({ 
                    type: 'runRequest',
                    request
                  });
                  break;
                case 'saveToCollection':
                  vscode.postMessage({ 
                    type: 'saveToCollection',
                    request
                  });
                  break;
                case 'openRequest':
                  vscode.postMessage({ 
                    type: 'openRequest',
                    request
                  });
                  break;
                case 'delete':
                  vscode.postMessage({ 
                    type: 'deleteRequest',
                    source: 'activity',
                    requestId: request.id
                  });
                  break;
                // Other actions can be added as needed
              }
            }
            
            // Render activity list
            function renderActivities(searchFilter = '') {
              const activityList = document.getElementById('activityList');
  
              if (activities.length === 0) {
                activityList.innerHTML = '<div class="empty-state">No recent requests found.</div>';
                return;
              }
              
              const filteredActivities = searchFilter ? 
                activities.filter(req => {
                  const url = (req.url || '').toLowerCase();
                  const method = (req.method || '').toLowerCase();
                  return url.includes(searchFilter) || method.includes(searchFilter);
                }) : 
                activities;
              
              if (filteredActivities.length === 0) {
                activityList.innerHTML = '<div class="empty-state">No matching requests found.</div>';
                return;
              }
              
              let html = '';
              
              filteredActivities.forEach(request => {
                const path = formatPath(request.url);
                const timestamp = new Date(); // Replace with actual timestamp from request when available
                
                html += \`
                  <div class="activity-item" data-id="\${request.id}">
                    <span class="method-badge method-\${request.method.toLowerCase()}">\${request.method}</span>
                    <span class="activity-path">\${path}</span>
                    <div class="activity-time">\${formatRelativeTime(timestamp)}</div>
                  </div>
                \`;
              });
              
              activityList.innerHTML = html;
              
              // Add click event listeners to items
              activityList.querySelectorAll('.activity-item').forEach(item => {
                // Regular click to open request
                item.addEventListener('click', () => {
                  const id = item.dataset.id;
                  const request = activities.find(r => r.id === id);
                  if (request) {
                    vscode.postMessage({ 
                      type: 'openRequest',
                      request
                    });
                  }
                });
                
                // Right click for context menu
                item.addEventListener('contextmenu', (e) => {
                  e.preventDefault();
                  const id = item.dataset.id;
                  const request = activities.find(r => r.id === id);
                  if (request) {
                    showContextMenu(request, e.pageX, e.pageY);
                  }
                });
              });
            }
            
            // Render collections list
            function renderCollections() {
              const collectionsList = document.getElementById('collectionsList');
              
              if (collections.length === 0) {
                collectionsList.innerHTML = '<div class="empty-state">No collections found.</div>';
                return;
              }
              
              let html = '';
              
              collections.forEach(collection => {
                html += \`
                  <div class="collection-container" data-id="\${collection.id}">
                    <div class="collection-header">
                      <span>\${collection.name}</span>
                      <span>\${collection.requests.length}</span>
                    </div>
                    <div class="collection-items">
                \`;
                
                // Add requests for this collection
                collection.requests.forEach(request => {
                  const path = formatPath(request.url);
                  
                  html += \`
                    <div class="activity-item" data-id="\${request.id}">
                      <span class="method-badge method-\${request.method.toLowerCase()}">\${request.method}</span>
                      <span class="activity-path">\${request.name || path}</span>
                    </div>
                  \`;
                });
                
                html += \`
                    </div>
                  </div>
                \`;
              });
              
              collectionsList.innerHTML = html;
              
              // Add click event listeners for collection headers
              collectionsList.querySelectorAll('.collection-header').forEach(header => {
                header.addEventListener('click', () => {
                  const container = header.closest('.collection-container');
                  const items = container.querySelector('.collection-items');
                  items.classList.toggle('expanded');
                });
              });
              
              // Add click event listeners for requests
              collectionsList.querySelectorAll('.activity-item').forEach(item => {
                item.addEventListener('click', () => {
                  const id = item.dataset.id;
                  // Find the request in any collection
                  let foundRequest = null;
                  collections.forEach(collection => {
                    const request = collection.requests.find(r => r.id === id);
                    if (request) {
                      foundRequest = request;
                    }
                  });
                  
                  if (foundRequest) {
                    vscode.postMessage({ 
                      type: 'openRequest', 
                      request: foundRequest 
                    });
                  }
                });
              });
            }
            
            // Render environments list
            function renderEnvironments() {
              const environmentsList = document.getElementById('environmentsList');
              
              if (environments.length === 0) {
                environmentsList.innerHTML = '<div class="empty-state">No environments found.</div>';
                return;
              }
              
              let html = '';
              
              environments.forEach(env => {
                html += \`
                  <div class="collection-container" data-id="\${env.id}">
                    <div class="collection-header">
                      <span>\${env.name}</span>
                      <span>\${Object.keys(env.variables).length}</span>
                    </div>
                    <div class="collection-items">
                \`;
                
                // Add variables for this environment
                Object.entries(env.variables).forEach(([key, value]) => {
                  html += \`
                    <div class="activity-item">
                      <span class="activity-path">\${key}: \${value}</span>
                    </div>
                  \`;
                });
                
                html += \`
                    </div>
                  </div>
                \`;
              });
              
              environmentsList.innerHTML = html;
              
              // Add click event listeners for environment headers
              environmentsList.querySelectorAll('.collection-header').forEach(header => {
                header.addEventListener('click', () => {
                  const container = header.closest('.collection-container');
                  const items = container.querySelector('.collection-items');
                  items.classList.toggle('expanded');
                });
              });
            }
            
            // Handle messages from extension
            window.addEventListener('message', event => {
              const message = event.data;
              
              if (message.type === 'setData') {
                activities = message.activities || [];
                collections = message.collections || [];
                environments = message.environments || [];
                
                // Render all views
                renderActivities(activitySearch.value.toLowerCase());
                renderCollections();
                renderEnvironments();
              }
            });
            
            // Initial data request
            vscode.postMessage({ type: 'refresh' });
          })();
        </script>
      </body>
      </html>`;
  }

  public getActivityProvider(): ActivityProvider {
    return this._activityProvider;
  }
}