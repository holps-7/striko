export function setupRequestHeader(vscode: any, state: any) {
  const headerContainer = document.createElement('div');
  headerContainer.className = 'header-container';
  
  // Create a form element to wrap the URL bar and send button
  // Using a form allows the Enter key to submit the request
  const form = document.createElement('form');
  form.className = 'url-form';
  form.style.display = 'flex';
  form.style.flex = '1';
  form.style.minWidth = '0';
  
  // Create URL bar content
  const urlBar = document.createElement('div');
  urlBar.className = 'url-bar';
  
  // Create method select dropdown
  const methodSelect = document.createElement('select');
  methodSelect.id = 'httpMethod';
  methodSelect.className = 'method-select';
  
  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
  methods.forEach(method => {
    const option = document.createElement('option');
    option.value = method;
    option.textContent = method;
    methodSelect.appendChild(option);
  });
  
  // Create URL input field
  const urlInput = document.createElement('input');
  urlInput.type = 'text';
  urlInput.id = 'url';
  urlInput.className = 'url-input';
  urlInput.placeholder = 'Enter request URL';
  
  // Create the send button
  const sendButton = document.createElement('button');
  sendButton.id = 'sendButton';
  sendButton.className = 'button';
  sendButton.textContent = 'Send';
  sendButton.type = 'submit'; // Make it a submit button for the form
  
  // Assemble the components
  urlBar.appendChild(methodSelect);
  urlBar.appendChild(urlInput);
  
  // Add URL bar and send button to the form
  form.appendChild(urlBar);
  form.appendChild(sendButton);
  
  // Add the form to the header container
  headerContainer.appendChild(form);
  
  // Add the header to the DOM
  document.getElementById('request-header')?.appendChild(headerContainer);
  
  // Setup event listeners
  methodSelect.addEventListener('change', () => {
    window.dispatchEvent(new CustomEvent('request-updated', { detail: state }));
  });
  
  urlInput.addEventListener('input', () => {
    window.dispatchEvent(new CustomEvent('request-updated', { detail: state }));
  });
  
  form.addEventListener('submit', (e) => {
    e.preventDefault(); // Prevent actual form submission
    window.dispatchEvent(new CustomEvent('send-request', { detail: state }));
  });
}