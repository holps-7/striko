import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
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
        localResourceRoots: [
          vscode.Uri.joinPath(this._extensionUri, 'dist'),
          this._extensionUri
        ],
        retainContextWhenHidden: true
      }
    );

    // Get path to extension
    const scriptPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.js');
    // And convert to webview URI
    const scriptUri = this._panel.webview.asWebviewUri(scriptPathOnDisk);

    // Set the webview's html content
    this._panel.webview.html = `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${this._panel.webview.cspSource}; script-src ${this._panel.webview.cspSource};">
      <title>Striko API Client</title>
    </head>
    <body>
      <div class="main-container">
        <div class="content-container">
          <!-- Request side -->
          <div class="request-container">
            <div id="request-header"></div>
            <div id="request-tabs"></div>
            <div class="panels-container" id="request-panels"></div>
          </div>
          
          <!-- Resizer -->
          <div class="resizer" id="resizer"></div>
          
          <!-- Response side -->
          <div class="response-container">
            <div id="response-status"></div>
            <div id="response-tabs"></div>
            <div class="panels-container" id="response-panels"></div>
          </div>
        </div>
      </div>
      
      <!-- Shortcut hint -->
      <div class="shortcut-hint">
        Save to Activity: <kbd>Ctrl</kbd>+<kbd>S</kbd> or <kbd>⌘</kbd>+<kbd>S</kbd>
      </div>
      
      <!-- Toast notification -->
      <div class="toast" id="saveToast">Request saved to Activity</div>
      
      <script src="${scriptUri}"></script>
    </body>
    </html>`;

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

}