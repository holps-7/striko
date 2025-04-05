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

    // Find the bundled webview HTML file
    try {
      // Get paths to bundled resources
      const webviewHtmlPath = vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.html');
      const webviewHtmlPathOnDisk = webviewHtmlPath.fsPath;
      
      // Read the HTML file content
      let htmlContent = fs.readFileSync(webviewHtmlPathOnDisk, 'utf8');
      
      // Convert all asset paths to webview URIs
      htmlContent = this.rewriteAssetPaths(htmlContent, this._panel.webview);
      
      // Set the webview's HTML content
      this._panel.webview.html = htmlContent;
    } catch (error) {
      // Fallback if bundled HTML isn't found
      console.error('Error loading webview HTML:', error);
      
      // Create a basic HTML page
      this._panel.webview.html = `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Striko API Client</title>
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${this._panel.webview.cspSource}; script-src ${this._panel.webview.cspSource};">
      </head>
      <body>
        <div style="padding: 20px; text-align: center;">
          <h2>Failed to load Striko API Client</h2>
          <p>Please try reloading the extension.</p>
        </div>
      </body>
      </html>`;
    }

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

  /**
   * Rewrites asset paths in the HTML to use webview URIs
   */
  private rewriteAssetPaths(htmlContent: string, webview: vscode.Webview): string {
    // Match script and stylesheet tags with src/href attributes
    const scriptRegex = /<script[^>]*src=['"]([^'"]+)['"]/g;
    const styleRegex = /<link[^>]*href=['"]([^'"]+)['"][^>]*>/g;
    
    // Rewrite script sources
    htmlContent = htmlContent.replace(scriptRegex, (match, src) => {
      if (src.startsWith('./') || src.startsWith('../') || !src.startsWith('http')) {
        const assetUri = vscode.Uri.joinPath(this._extensionUri, 'dist', src);
        const webviewUri = webview.asWebviewUri(assetUri).toString();
        return match.replace(src, webviewUri);
      }
      return match;
    });
    
    // Rewrite stylesheet href attributes
    htmlContent = htmlContent.replace(styleRegex, (match, href) => {
      if (href.startsWith('./') || href.startsWith('../') || !href.startsWith('http')) {
        const assetUri = vscode.Uri.joinPath(this._extensionUri, 'dist', href);
        const webviewUri = webview.asWebviewUri(assetUri).toString();
        return match.replace(href, webviewUri);
      }
      return match;
    });
    
    return htmlContent;
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