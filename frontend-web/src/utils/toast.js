// Simple toast notification system
let toastContainer = null;

const createToastContainer = () => {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
};

const showToast = (message, type = 'info', duration = 3000) => {
  const container = createToastContainer();

  const toast = document.createElement('div');
  toast.style.cssText = `
    background: ${type === 'success' ? 'rgba(6, 214, 160, 0.95)' :
                 type === 'error' ? 'rgba(239, 71, 111, 0.95)' :
                 'rgba(35, 131, 226, 0.95)'};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    pointer-events: auto;
    animation: slideInRight 0.3s ease-out, fadeOut 0.3s ease-in ${duration - 300}ms forwards;
    max-width: 350px;
    word-wrap: break-word;
  `;
  toast.textContent = message;

  // Add animation styles if not already present
  if (!document.getElementById('toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes fadeOut {
        to {
          opacity: 0;
          transform: translateX(20px);
        }
      }
    `;
    document.head.appendChild(style);
  }

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
    if (container.children.length === 0) {
      container.remove();
      toastContainer = null;
    }
  }, duration);
};

export const toast = {
  success: (message) => showToast(message, 'success'),
  error: (message) => showToast(message, 'error'),
  info: (message) => showToast(message, 'info'),
};
