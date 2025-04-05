import './styles/main.css';
import './styles/header.css';
import './styles/panels.css';
import './styles/components.css';

import { setupRequestHeader } from './components/header';
import { setupTabs } from './components/tabs';
import { setupRequestPanels } from './components/request';
import { setupResponsePanels } from './components/response';
import { setupResizer } from './components/resizer';
import { setupMessaging } from './utils/messaging';
import { registerShortcuts } from './utils/shortcuts';

// Initialize the webview
(function() {
  const vscode = acquireVsCodeApi();
  
  // State for the app
  const state = {
    currentRequest: {
      id: crypto.randomUUID(),
      name: 'New Request',
      method: 'GET',
      url: '',
      headers: {},
      params: {},
      auth: { type: 'none' },
      bodyType: 'none'
    },
    saveToast: document.getElementById('saveToast') as HTMLElement
  };
  
  // Setup components
  setupRequestHeader(vscode, state);
  setupTabs();
  setupRequestPanels(vscode, state);
  setupResponsePanels();
  setupResizer();
  setupMessaging(vscode, state);
  registerShortcuts(vscode, state);
})();