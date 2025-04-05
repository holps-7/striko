export function setupTabs() {
  // Setup request tabs
  const requestTabs = document.createElement('div');
  requestTabs.className = 'tabs-container';
  requestTabs.innerHTML = `
    <div class="tab-section">
      <div class="tabs">
        <div class="tab active" data-tab="query">Query</div>
        <div class="tab" data-tab="headers">Headers</div>
        <div class="tab" data-tab="auth">Auth</div>
        <div class="tab" data-tab="body">Body</div>
        <div class="tab" data-tab="tests">Tests</div>
        <div class="tab" data-tab="prerun">Pre Run</div>
      </div>
    </div>
  `;
  document.getElementById('request-tabs')?.appendChild(requestTabs);
  
  // Setup response tabs
  const responseTabs = document.createElement('div');
  responseTabs.className = 'tabs-container';
  responseTabs.innerHTML = `
    <div class="tab-section">
      <div class="tabs">
        <div class="tab active" data-tab="response">Response</div>
        <div class="tab" data-tab="responseHeaders">Headers</div>
        <div class="tab" data-tab="cookies">Cookies</div>
        <div class="tab" data-tab="results">Results</div>
      </div>
    </div>
  `;
  document.getElementById('response-tabs')?.appendChild(responseTabs);
  
  // Add tab switching functionality
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabSection = tab.closest('.tab-section');
      const targetTab = (tab as HTMLElement).dataset.tab;
      
      // Deactivate all tabs in this section
      tabSection?.querySelectorAll('.tab').forEach(t => {
        t.classList.remove('active');
      });
      
      // Activate clicked tab
      tab.classList.add('active');
      
      // Find the relevant panels container
      const container = tab.closest('.tabs-container');
      const panelsId = container?.parentElement?.id === 'request-tabs' ? 'request-panels' : 'response-panels';
      const panelsContainer = document.getElementById(panelsId);
      
      // Hide all panels
      panelsContainer?.querySelectorAll('.panel, .response-panel').forEach(panel => {
        panel.classList.remove('active');
      });
      
      // Show the corresponding panel
      const panelId = `${targetTab}Panel`;
      const panel = document.getElementById(panelId);
      if (panel) {
        panel.classList.add('active');
      }
    });
  });
}