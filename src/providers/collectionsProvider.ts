import * as vscode from 'vscode';
import { StorageProvider } from './storageProvider';

export class CollectionsProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private storageProvider: StorageProvider) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
    try {
      if (!element) {
        // Root level - return collections
        const collections = await this.storageProvider.getAllCollections();
        console.log('Collections loaded:', collections.length);
        
        return collections.map(collection => {
          const treeItem = new vscode.TreeItem(
            collection.name, 
            vscode.TreeItemCollapsibleState.Collapsed
          );
          treeItem.tooltip = `Collection: ${collection.name}`;
          treeItem.contextValue = 'collection';
          treeItem.id = collection.id;
          return treeItem;
        });
      } 
      else if (element.contextValue === 'collection') {
        // Collection level - return requests
        const collectionId = element.id!;
        const collection = await this.storageProvider.getCollection(collectionId);
        
        if (!collection) {
          return [];
        }
        
        return collection.requests.map(request => {
          const treeItem = new vscode.TreeItem(
            request.name,
            vscode.TreeItemCollapsibleState.None
          );
          treeItem.tooltip = `${request.method} ${request.url}`;
          treeItem.description = request.method;
          treeItem.contextValue = 'request';
          treeItem.command = {
            command: 'striko.openRequest',
            title: 'Open Request',
            arguments: [request]
          };
          return treeItem;
        });
      }
      
      return [];
    } catch (error) {
      console.error('Error in CollectionsProvider.getChildren:', error);
      return [new vscode.TreeItem('Error loading collections')];
    }
  }
}