import { formatBytes, generateRequestName } from './formatters';

export function setupMessaging(vscode: any, state: any) {
  function updateCurrentRequest(saveToActivity = false) {
    const method = (document.getElementById('httpMethod') as HTMLSelectElement).value;
    const url = (document.getElementById('url') as HTMLInputElement).value;
    
    // Auto-generate name from method and URL
    state.currentRequest.name = generateRequestName(method, url);
    state.currentRequest.method = method;
    state.currentRequest.url = url;
    
    // Collect headers
    state.currentRequest.headers = {};
    document.querySelectorAll('#headersList tr').forEach(row => {
      const enabled = (row.querySelector('input[type="checkbox"]') as HTMLInputElement).checked;
      if (enabled) {
        const inputs = row.querySelectorAll('input[type="text"]');
        const key = (inputs[0] as HTMLInputElement).value;
        const value = (inputs[1] as HTMLInputElement).value;
        if (key) {
          state.currentRequest.headers[key] = value;
        }
      }
    });
    
    // Collect query parameters
    state.currentRequest.params = {};
    document.querySelectorAll('#queryParamsList tr').forEach(row => {
      const enabled = (row.querySelector('input[type="checkbox"]') as HTMLInputElement).checked;
      if (enabled) {
        const inputs = row.querySelectorAll('input[type="text"]');
        const key = (inputs[0] as HTMLInputElement).value;
        const value = (inputs[1] as HTMLInputElement).value;
        if (key) {
          state.currentRequest.params[key] = value;
        }
      }
    });
    
    // Get body
    const bodyType = (document.getElementById('bodyType') as HTMLSelectElement).value;
    const bodyContent = (document.getElementById('bodyContent') as HTMLTextAreaElement).value;
    state.currentRequest.bodyType = bodyType;
    
    if (bodyType === 'json' && bodyContent) {
      try {
        state.currentRequest.body = JSON.parse(bodyContent);
      } catch (e) {
        // Invalid JSON - don't update body
      }
    } else if (bodyContent && bodyType !== 'none') {
      state.currentRequest.body = bodyContent;
    } else {
      state.currentRequest.body = null;
    }
    
    // Get auth
    const authType = (document.getElementById('authType') as HTMLSelectElement).value;
    state.currentRequest.auth = { type: authType };
    
    if (authType !== 'none') {
      state.currentRequest.auth.credentials = {};
      
      if (authType === 'basic') {
        const username = (document.getElementById('basicUsername') as HTMLInputElement)?.value;
        const password = (document.getElementById('basicPassword') as HTMLInputElement)?.value;
        if (username) {state.currentRequest.auth.credentials.username = username;}
        if (password) {state.currentRequest.auth.credentials.password = password;}
      }
      else if (authType === 'bearer') {
        const token = (document.getElementById('bearerToken') as HTMLInputElement)?.value;
        if (token) {state.currentRequest.auth.credentials.token = token;}
      }
      else if (authType === 'apikey') {
        const key = (document.getElementById('apiKeyName') as HTMLInputElement)?.value;
        const value = (document.getElementById('apiKeyValue') as HTMLInputElement)?.value;
        const location = (document.getElementById('apiKeyLocation') as HTMLSelectElement)?.value;
        if (key) {state.currentRequest.auth.credentials.key = key;}
        if (value) {state.currentRequest.auth.credentials.value = value;}
        if (location) {state.currentRequest.auth.credentials.location = location;}
      }
    }
    
    // Get tests and pre-run script
    state.currentRequest.tests = (document.getElementById('testsContent') as HTMLTextAreaElement).value;
    state.currentRequest.preRun = (document.getElementById('prerunContent') as HTMLTextAreaElement).value;
    
    // Notify extension of updated request
    vscode.postMessage({
      command: 'requestUpdated',
      request: state.currentRequest,
      saveToActivity: saveToActivity
    });
  }
  
  // Show toast notification
  function showToast() {
    state.saveToast.style.display = 'block';
    
    setTimeout(() => {
      state.saveToast.style.display = 'none';
    }, 2000);
  }
  
  // Listen for local events
  window.addEventListener('request-updated', () => updateCurrentRequest());
  
  window.addEventListener('send-request', () => {
    updateCurrentRequest();
    
    if (!state.currentRequest.url) {
      vscode.postMessage({ 
        command: 'showErrorMessage', 
        message: 'Please enter a URL' 
      });
      return;
    }
    
    vscode.postMessage({
      command: 'sendRequest',
      request: state.currentRequest
    });
  });
  
  // Handle messages from the extension
  window.addEventListener('message', event => {
    const message = event.data;
    
    if (message.command === 'receiveResponse') {
      // Display response data
      const response = message.response;
      
      // Update status bar
      const statusValue = document.getElementById('statusValue');
      const sizeValue = document.getElementById('sizeValue');
      const timeValue = document.getElementById('timeValue');
      
      if (statusValue) {statusValue.textContent = `${response.status} ${response.statusText}`;}
      if (sizeValue) {sizeValue.textContent = formatBytes(response.size);}
      if (timeValue) {timeValue.textContent = `${response.time}ms`;}
      
      // Update response body
      const responseBody = document.getElementById('responseBody');
      if (responseBody) {
        if (typeof response.data === 'object') {
          responseBody.textContent = JSON.stringify(response.data, null, 2);
        } else {
          responseBody.textContent = response.data;
        }
      }
      
      // Update response headers
      const headersList = document.getElementById('responseHeadersList');
      if (headersList) {
        let headersHTML = '<div style="white-space: pre-wrap;">';
        
        for (const key in response.headers) {
          headersHTML += `<div><strong>${key}:</strong> ${response.headers[key]}</div>`;
        }
        
        headersHTML += '</div>';
        headersList.innerHTML = headersHTML;
      }
    }
    else if (message.command === 'loadRequest') {
      // Load request data into UI
      state.currentRequest = message.request;
      
      // Update method and URL
      const httpMethod = document.getElementById('httpMethod') as HTMLSelectElement;
      const urlInput = document.getElementById('url') as HTMLInputElement;
      
      if (httpMethod) {httpMethod.value = state.currentRequest.method;}
      if (urlInput) {urlInput.value = state.currentRequest.url;}
      
      // More loading logic can be added here
    }
  });
}