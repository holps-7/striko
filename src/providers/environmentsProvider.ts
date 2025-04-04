import * as vscode from 'vscode';
import { StorageProvider } from './storageProvider';

export class EnvironmentsProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
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
        // Root level - return environments
        const environments = await this.storageProvider.getAllEnvironments();
        console.log('Environments loaded:', environments.length);
        
        return environments.map(env => {
          const treeItem = new vscode.TreeItem(
            env.name,
            vscode.TreeItemCollapsibleState.Collapsed
          );
          treeItem.tooltip = `Environment: ${env.name}`;
          treeItem.contextValue = 'environment';
          treeItem.id = env.id;
          return treeItem;
        });
      } 
      else if (element.contextValue === 'environment') {
        // Environment level - return variables
        const envId = element.id!;
        const environment = await this.storageProvider.getEnvironment(envId);
        
        if (!environment) {
          return [];
        }
        
        return Object.entries(environment.variables).map(([key, value]) => {
          const treeItem = new vscode.TreeItem(`${key}: ${value}`);
          treeItem.tooltip = `${key}: ${value}`;
          treeItem.contextValue = 'variable';
          return treeItem;
        });
      }
      
      return [];
    } catch (error) {
      console.error('Error in EnvironmentsProvider.getChildren:', error);
      return [new vscode.TreeItem('Error loading environments')];
    }
  }
}