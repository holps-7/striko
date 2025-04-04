import * as vscode from 'vscode';
import { WebviewProvider } from './providers/webviewProvider';
import { UnifiedSidebarProvider } from './providers/unifiedSidebarProvider';
import { ActivityProvider } from './providers/activityProvider';
import { StorageProvider } from './providers/storageProvider';
import { v4 as uuidv4 } from 'uuid';
import { Collection } from './models/collection';
import { Request } from './models/request';

// Create a bridge object to coordinate between providers
class ActivityBridge {
  private _sidebarProvider?: UnifiedSidebarProvider;
  
  setSidebarProvider(provider: UnifiedSidebarProvider) {
    this._sidebarProvider = provider;
  }
  
  refreshActivity() {
    if (this._sidebarProvider) {
      this._sidebarProvider.refreshActivity();
    }
  }
}

export function activate(context: vscode.ExtensionContext) {
  console.log('Activating Striko API client extension');
  
  // Create bridge for activity updates
  const activityBridge = new ActivityBridge();
  
  // Create storage provider
  const storageProvider = new StorageProvider(context);
  
  // Create activity provider
  const activityProvider = new ActivityProvider(activityBridge);
  
  // Create the unified sidebar provider
  const sidebarProvider = new UnifiedSidebarProvider(
    context.extensionUri, 
    storageProvider,
    activityProvider
  );
  
  // Set sidebar provider in the bridge for communication
  activityBridge.setSidebarProvider(sidebarProvider);
  
  // Register the sidebar view
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      UnifiedSidebarProvider.viewType,
      sidebarProvider
    )
  );
  
  // Create the main editor panel provider
  const webviewPanel = new WebviewProvider(
    context.extensionUri, 
    storageProvider,
    activityProvider
  );
  
  // Open API client in editor
  context.subscriptions.push(
    vscode.commands.registerCommand('striko.openClient', () => {
      webviewPanel.createOrShowPanel();
    })
  );
  
  // Open a specific request
  context.subscriptions.push(
    vscode.commands.registerCommand('striko.openRequest', (request) => {
      webviewPanel.createOrShowPanel();
      webviewPanel.loadRequest(request);
    })
  );
  
  // Save current request to a collection
  context.subscriptions.push(
    vscode.commands.registerCommand('striko.saveRequest', async () => {
      const request = await webviewPanel.getCurrentRequest();
      if (!request) {
        vscode.window.showErrorMessage('No active request to save');
        return;
      }
      
      // Get all collections
      const collections = await storageProvider.getAllCollections();
      
      // Get collection to save to
      const collectionItems = collections.map(c => ({ label: c.name, id: c.id }));
      collectionItems.push({ label: '+ Create new collection', id: 'new' });
      
      const selected = await vscode.window.showQuickPick(collectionItems, {
        placeHolder: 'Select a collection to save to'
      });
      
      if (!selected) {
        return;
      }
      
      if (selected.id === 'new') {
        // Create new collection
        const name = await vscode.window.showInputBox({
          placeHolder: 'Enter collection name'
        });
        
        if (!name) {
          return;
        }
        
        const collection: Collection = {
          id: uuidv4(),
          name,
          requests: [request]
        };
        
        await storageProvider.saveCollection(collection);
      } else {
        // Add to existing collection
        const collection = await storageProvider.getCollection(selected.id);
        if (!collection) {
          return;
        }
        
        // Check if request already exists in collection
        const existingIndex = collection.requests.findIndex(r => r.id === request.id);
        
        if (existingIndex >= 0) {
          // Update existing request
          collection.requests[existingIndex] = request;
        } else {
          // Add new request
          collection.requests.push(request);
        }
        
        await storageProvider.saveCollection(collection);
      }
      
      // Refresh sidebar
      sidebarProvider.refreshActivity();
      
      vscode.window.showInformationMessage('Request saved to collection');
    })
  );
  
  // Create new request
  context.subscriptions.push(
    vscode.commands.registerCommand('striko.newRequest', () => {
      webviewPanel.createOrShowPanel();
      webviewPanel.createNewRequest();
    })
  );
}

export function deactivate() {}