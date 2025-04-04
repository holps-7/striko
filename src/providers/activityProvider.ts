import * as vscode from 'vscode';
import { Request } from '../models/request';

// Interface for the activity bridge
interface ActivityBridge {
  refreshActivity(): void;
}

export class ActivityProvider implements vscode.TreeDataProvider<RequestItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<RequestItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  
  // Store recent requests in memory
  private recentRequests: Request[] = [];
  
  constructor(private bridge?: ActivityBridge) {}
  
  refresh(): void {
    this._onDidChangeTreeData.fire();
    
    // Notify the bridge to refresh the sidebar
    if (this.bridge) {
      this.bridge.refreshActivity();
    }
  }
  
  getTreeItem(element: RequestItem): vscode.TreeItem {
    return element;
  }
  
  getChildren(element?: RequestItem): RequestItem[] {
    if (!element) {
      // Root level - return recent requests
      return this.recentRequests.map(request => {
        const item = new RequestItem(
          request.url.replace(/^https?:\/\//, ''),
          request,
          vscode.TreeItemCollapsibleState.None
        );
        
        // Add method badge
        item.description = request.method;
        
        // Add timestamp
        const timestamp = new Date();
        const minutes = Math.floor((Date.now() - timestamp.getTime()) / 60000);
        if (minutes < 60) {
          item.tooltip = `${minutes} mins ago`;
        } else {
          item.tooltip = timestamp.toLocaleString();
        }
        
        // Add command to open request
        item.command = {
          command: 'striko.openRequest',
          title: 'Open Request',
          arguments: [request]
        };
        
        return item;
      });
    }
    
    return [];
  }
  
  // Add a new request to activity history
  addRequest(request: Request): void {
    // Don't add requests without URLs
    if (!request.url) {
      return;
    }
    
    console.log('Adding request to activity:', request.method, request.url);
    
    // Check if request already exists
    const existingIndex = this.recentRequests.findIndex(r => 
      r.id === request.id
    );
    
    if (existingIndex >= 0) {
      // Remove existing entry
      this.recentRequests.splice(existingIndex, 1);
    }
    
    // Add to the beginning of the array (most recent first)
    this.recentRequests.unshift({...request});
    
    // Limit to 20 most recent requests
    if (this.recentRequests.length > 20) {
      this.recentRequests.pop();
    }
    
    this.refresh();
  }
  
  // Remove a request from activity history
  removeRequest(requestId: string): boolean {
    const initialLength = this.recentRequests.length;
    this.recentRequests = this.recentRequests.filter(r => r.id !== requestId);
    
    if (initialLength !== this.recentRequests.length) {
      this.refresh();
      return true;
    }
    
    return false;
  }
  
  // Get recent requests for the unified sidebar
  getRecentRequests(): Request[] {
    return [...this.recentRequests];
  }
}

class RequestItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly request: Request,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    
    // Set icon based on HTTP method
    const methodIconMap: {[key: string]: string} = {
      'GET': 'symbol-variable',
      'POST': 'add',
      'PUT': 'arrow-up',
      'DELETE': 'trash',
      'PATCH': 'edit',
      'HEAD': 'eye',
      'OPTIONS': 'list-flat'
    };
    
    const iconName = methodIconMap[request.method] || 'symbol-variable';
    this.iconPath = new vscode.ThemeIcon(iconName);
    
    this.contextValue = 'request';
  }
}