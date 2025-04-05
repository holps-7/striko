export function setupResizer() {
  const resizer = document.getElementById('resizer');
  const requestContainer = document.querySelector('.request-container') as HTMLElement;
  const responseContainer = document.querySelector('.response-container') as HTMLElement;
  const contentContainer = document.querySelector('.content-container') as HTMLElement;
  
  if (!resizer || !requestContainer || !responseContainer || !contentContainer) {
    console.error('Required elements not found for resizer');
    return;
  }
  
  let startX = 0;
  let startRequestWidth = 0;
  let contentWidth = 0;
  
  const mouseDownHandler = function(e: MouseEvent) {
    // Get initial position
    startX = e.clientX;
    startRequestWidth = requestContainer.getBoundingClientRect().width;
    contentWidth = contentContainer.getBoundingClientRect().width;
    
    // Add event listeners for mouse movement and release
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
    
    // Add cursor styles to document to maintain during drag
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none'; // Prevent text selection during resize
    
    // Add a class to both containers to apply any visual feedback during resize
    requestContainer.classList.add('resizing');
    responseContainer.classList.add('resizing');
  };
  
  const mouseMoveHandler = function(e: MouseEvent) {
    // Calculate how far the mouse has moved
    const dx = e.clientX - startX;
    
    // Calculate new width as a percentage of the content container
    // with minimum and maximum constraints
    let newWidth = (startRequestWidth + dx) / contentWidth * 100;
    
    // Set minimum and maximum constraints (%)
    newWidth = Math.max(10, Math.min(newWidth, 90));
    
    // Apply the new width to both containers
    requestContainer.style.width = `${newWidth}%`;
    responseContainer.style.width = `${100 - newWidth}%`;
  };
  
  const mouseUpHandler = function() {
    // Remove event listeners
    document.removeEventListener('mousemove', mouseMoveHandler);
    document.removeEventListener('mouseup', mouseUpHandler);
    
    // Reset cursor and selection styles
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    
    // Remove the resize feedback classes
    requestContainer.classList.remove('resizing');
    responseContainer.classList.remove('resizing');
  };
  
  // Add the mousedown event listener to the resizer
  resizer.addEventListener('mousedown', mouseDownHandler);
  
  // Add a window resize listener to update sizes if needed
  window.addEventListener('resize', function() {
    // Recalculate content width if needed
    contentWidth = contentContainer.getBoundingClientRect().width;
  });
}