// facebook-browser-check.ts

interface ModalElements {
  modal: HTMLDivElement;
  overlay: HTMLDivElement;
  openButton: HTMLButtonElement | null;
  cancelButton: HTMLButtonElement | null;
}

/**
 * Detects if the current browser is the Facebook in-app browser
 * (iOS: FBAV, Android: FBAN or FBAV)
 */
function isFacebookBrowser(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('fban') || ua.includes('fbav');
}

/**
 * Creates and injects the modal DOM elements into the page
 */
function createModal(): ModalElements {
  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'fb-browser-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    z-index: 9998;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  `;

  // Create modal
  const modal = document.createElement('div');
  modal.id = 'fb-browser-modal';
  modal.style.cssText = `
    background: white;
    border-radius: 16px;
    max-width: 320px;
    width: 85%;
    padding: 24px 20px 20px;
    text-align: center;
    box-shadow: 0 20px 35px -8px rgba(0, 0, 0, 0.3);
    animation: fadeInUp 0.3s ease-out;
    z-index: 9999;
  `;

  // Add animation keyframes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  document.head.appendChild(style);

  // Modal content
  modal.innerHTML = `
    <div style="margin-bottom: 16px;">
      <span style="font-size: 48px;">🌐</span>
    </div>
    <h3 style="margin: 0 0 8px; font-size: 20px; font-weight: 600; color: #1e293b;">Better Experience Available</h3>
    <p style="margin: 0 0 20px; font-size: 14px; color: #475569; line-height: 1.5;">
      For the best experience with ringtones, please open this page in your default browser (Chrome/Safari). 
      The Facebook browser may not support all features.
    </p>
    <div style="display: flex; gap: 12px; justify-content: center;">
      <button id="modal-cancel-btn" style="
        background: #f1f5f9;
        border: none;
        padding: 10px 18px;
        border-radius: 40px;
        font-size: 14px;
        font-weight: 500;
        color: #475569;
        cursor: pointer;
        transition: background 0.2s;
      ">Dismiss</button>
      <button id="modal-open-btn" style="
        background: #3b82f6;
        border: none;
        padding: 10px 22px;
        border-radius: 40px;
        font-size: 14px;
        font-weight: 500;
        color: white;
        cursor: pointer;
        transition: background 0.2s;
        box-shadow: 0 2px 6px rgba(59,130,246,0.3);
      ">Open in Browser</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const openButton = modal.querySelector('#modal-open-btn') as HTMLButtonElement;
  const cancelButton = modal.querySelector('#modal-cancel-btn') as HTMLButtonElement;

  return { modal, overlay, openButton, cancelButton };
}

/**
 * Handles "Open in Browser" action.
 * Attempts to open the current URL in external browser (Chrome/Safari) using intent/system prompts.
 */
function openInExternalBrowser(): void {
  const currentUrl = window.location.href;
  const userAgent = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);

  // iOS: Use window.open with a short delay to avoid being blocked
  if (isIOS) {
    // For iOS, we can't directly open Safari, but we can show an alert with instructions
    // Alternatively, use window.open with `_system` if using Cordova/WebView, but here we instruct.
    // Better: Use A-Href with target="_blank"? No, FB blocks that.
    // Show instructional alert with clear steps.
    alert("To open in Safari:\n\n1. Tap the ••• menu (bottom bar)\n2. Tap 'Open in Safari'\n\nFor best ringtone experience, please use Safari.");
    return;
  }

  // Android: Try to launch Chrome or default browser via intent:// scheme
  if (isAndroid) {
    try {
      // Create an intent:// URL to force open in external browser
      // Format: intent://HOST/PATH#Intent;scheme=http;package=com.android.chrome;end;
      const urlObj = new URL(currentUrl);
      const intentUrl = `intent://${urlObj.host}${urlObj.pathname}${urlObj.search}#Intent;scheme=http;package=com.android.chrome;end;`;
      
      // Fallback to regular window.open if intent fails
      const newWindow = window.open(intentUrl, '_blank');
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // Intent failed, fallback to instruction
        alert("Please copy the link and open in Chrome:\n\n" + currentUrl);
      }
    } catch (e) {
      alert("Please copy the link and open in Chrome:\n\n" + currentUrl);
    }
    return;
  }

  // Desktop or others: just open new tab (though FB browser may still block)
  window.open(currentUrl, '_blank');
}

/**
 * Removes the modal overlay and cleans up
 */
function destroyModal(overlay: HTMLDivElement): void {
  if (overlay && overlay.parentNode) {
    overlay.parentNode.removeChild(overlay);
  }
}

/**
 * Main initializer: Check UA, show modal if needed, attach event handlers
 */
export function initFacebookBrowserWarning(): void {
  if (!isFacebookBrowser()) {
    return; // Not in Facebook browser, do nothing
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => showModalAndAttach());
  } else {
    showModalAndAttach();
  }
}

/**
 * Creates modal, attaches button events, and prevents body scroll.
 */
function showModalAndAttach(): void {
  const { overlay, openButton, cancelButton } = createModal();

  // Prevent background scroll when modal is open
  const originalOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  const cleanup = () => {
    document.body.style.overflow = originalOverflow;
    destroyModal(overlay);
  };

  openButton?.addEventListener('click', (e) => {
    e.preventDefault();
    openInExternalBrowser();
    cleanup();
  });

  cancelButton?.addEventListener('click', (e) => {
    e.preventDefault();
    cleanup();
  });

  // Also close if user clicks on overlay background
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      cleanup();
    }
  });
}

// Auto-initialize if this script is loaded as a module or directly via script tag
// This ensures the check runs immediately when the file is imported
if (typeof window !== 'undefined') {
  initFacebookBrowserWarning();
}