export function setupResizer() {
    const resizer = document.getElementById('resizer');
    const requestContainer = document.querySelector('.request-container') as HTMLElement;
    const responseContainer = document.querySelector('.response-container') as HTMLElement;
    
    if (!resizer || !requestContainer || !responseContainer) {return;}
    
    let x = 0;
    let requestWidth = 0;
    
    const mouseDownHandler = function(e: MouseEvent) {
      x = e.clientX;
      requestWidth = requestContainer.getBoundingClientRect().width;
      
      document.addEventListener('mousemove', mouseMoveHandler);
      document.addEventListener('mouseup', mouseUpHandler);
    };
    
    const mouseMoveHandler = function(e: MouseEvent) {
      const dx = e.clientX - x;
      const parentWidth = requestContainer.parentElement?.getBoundingClientRect().width || 0;
      const newWidth = ((requestWidth + dx) / parentWidth) * 100;
      
      requestContainer.style.width = `${newWidth}%`;
      responseContainer.style.width = `${100 - newWidth}%`;
    };
    
    const mouseUpHandler = function() {
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
    };
    
    resizer.addEventListener('mousedown', mouseDownHandler);
  }