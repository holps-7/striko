export function registerShortcuts(vscode: any, state: any) {
    document.addEventListener('keydown', event => {
      // Ctrl+S or Cmd+S to save to activity
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        
        if (state.currentRequest.url) {
          // Trigger custom event
          window.dispatchEvent(new CustomEvent('request-updated', { 
            detail: { saveToActivity: true }
          }));
          
          // Show toast
          state.saveToast.style.display = 'block';
          setTimeout(() => {
            state.saveToast.style.display = 'none';
          }, 2000);
          
          // Send message to extension
          vscode.postMessage({
            command: 'saveToActivity',
            request: state.currentRequest
          });
        }
      }
      
      // Ctrl+Enter or Cmd+Enter to send request
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        const sendButton = document.getElementById('sendButton');
        if (sendButton) {sendButton.click();}
      }
    });
  }