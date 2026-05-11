// social-browser-check.ts

interface ModalElements {
  modal: HTMLDivElement;
  overlay: HTMLDivElement;
  openButton: HTMLButtonElement | null;
  cancelButton: HTMLButtonElement | null;
}

type SocialPlatform = 'facebook' | 'instagram' | 'none';

/**
 * Detects if the current browser is Facebook or Instagram in-app browser
 */
function detectSocialBrowser(): SocialPlatform {
  const ua = navigator.userAgent.toLowerCase();
  
  // Facebook detection
  if (ua.includes('fban') || ua.includes('fbav')) {
    return 'facebook';
  }
  
  // Instagram detection  
  if (ua.includes('instagram')) {
    return 'instagram';
  }
  
  return 'none';
}

/**
 * Checks if currently in Safari (not in-app browser)
 */
function isSafari(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isSafari = /safari/.test(ua) && !/crios|fxios|fban|fbav|instagram/.test(ua);
  return isIOS && isSafari;
}

/**
 * Gets platform-specific modal content
 */
function getModalContent(platform: SocialPlatform): { title: string; message: string; icon: string; instruction?: string } {
  if (platform === 'facebook') {
    return {
      title: 'Better Experience Available',
      message: 'For the best experience with ringtone riches, please open this page in your default browser (Chrome/Safari). The Facebook browser may not support all features.',
      icon: '🎵',
      instruction: 'Tap the ••• menu (bottom bar) → "Open in Safari"'
    };
  } else {
    return {
      title: 'Open in Browser for Best Experience With Ringtone Riches',
      message: 'Instagram\'s built-in browser has limited features. For full access to ringtones, downloads, and premium features, please open in Chrome or Safari.',
      icon: '🎧',
      instruction: 'Tap ••• (top right) → "Open in Safari"'
    };
  }
}

/**
 * Creates and injects the premium modal DOM elements with black & yellow theme
 */
function createModal(platform: SocialPlatform): ModalElements {
  const { title, message, icon } = getModalContent(platform);
  const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
  
  // Create overlay with gradient background
  const overlay = document.createElement('div');
  overlay.id = 'social-browser-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.85) 100%);
    backdrop-filter: blur(12px);
    z-index: 9998;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  `;

  // Create modal with premium design
  const modal = document.createElement('div');
  modal.id = 'social-browser-modal';
  modal.style.cssText = `
    background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%);
    border: 1px solid rgba(255, 193, 7, 0.3);
    border-radius: 28px;
    max-width: 360px;
    width: 85%;
    padding: 32px 24px 28px;
    text-align: center;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 193, 7, 0.1);
    animation: fadeInUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    z-index: 9999;
    position: relative;
    overflow: hidden;
  `;

  // Add animated gradient border effect
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    
    @keyframes shimmer {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(100%);
      }
    }
    
    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
    }
    
    #social-browser-modal::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 2px;
      background: linear-gradient(90deg, transparent, #ffc107, #ffd54f, #ffc107, transparent);
      animation: shimmer 3s infinite;
    }
  `;
  document.head.appendChild(style);

  // Different button text for iOS vs Android
  const openButtonText = isIOS ? 'Copy Link & Open' : 'Open Browser ⚡';
  
  // Modal content with premium styling
  modal.innerHTML = `
    <div style="margin-bottom: 20px; position: relative;">
      <div style="
        width: 80px;
        height: 80px;
        margin: 0 auto;
        background: linear-gradient(135deg, #ffc10720 0%, #ffd54f10 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid rgba(255, 193, 7, 0.3);
      ">
        <span style="font-size: 48px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">${icon}</span>
      </div>
    </div>
    
    <h3 style="
      margin: 0 0 12px;
      font-size: 24px;
      font-weight: 700;
      background: linear-gradient(135deg, #ffc107 0%, #ffd54f 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.3px;
    ">${title}</h3>
    
    <p style="
      margin: 0 0 28px;
      font-size: 14px;
      color: #b0b0b0;
      line-height: 1.6;
    ">${message}</p>
    
    <div style="display: flex; gap: 12px; justify-content: center; margin-bottom: 16px;">
      <button id="modal-cancel-btn" style="
        background: transparent;
        border: 1.5px solid rgba(255, 255, 255, 0.2);
        padding: 12px 20px;
        border-radius: 40px;
        font-size: 14px;
        font-weight: 600;
        color: #a0a0a0;
        cursor: pointer;
        transition: all 0.3s ease;
        flex: 1;
        max-width: 110px;
      " 
      onmouseover="this.style.borderColor='rgba(255,193,7,0.5)'; this.style.color='#ffc107'"
      onmouseout="this.style.borderColor='rgba(255,255,255,0.2)'; this.style.color='#a0a0a0'"
      >Dismiss</button>
      
      <button id="modal-open-btn" style="
        background: linear-gradient(135deg, #ffc107 0%, #ffd54f 100%);
        border: none;
        padding: 12px 24px;
        border-radius: 40px;
        font-size: 14px;
        font-weight: 700;
        color: #000000;
        cursor: pointer;
        transition: all 0.3s ease;
        flex: 1;
        max-width: 160px;
        box-shadow: 0 4px 15px rgba(255, 193, 7, 0.3);
      "
      onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(255, 193, 7, 0.4)'"
      onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(255, 193, 7, 0.3)'"
      >${openButtonText}</button>
    </div>
    
    <div style="
      font-size: 11px;
      color: #666;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    ">
      ⚡ Faster downloads • Better quality • Full features
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const openButton = modal.querySelector('#modal-open-btn') as HTMLButtonElement;
  const cancelButton = modal.querySelector('#modal-cancel-btn') as HTMLButtonElement;

  return { modal, overlay, openButton, cancelButton };
}

/**
 * Copies text to clipboard
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  }
}

/**
 * Shows iOS instructions modal with working copy link
 */
function showIOSInstructions(platformName: string): void {
  const existingOverlay = document.getElementById('ios-instructions-overlay');
  if (existingOverlay) return;

  const currentUrl = window.location.href;
  
  const overlay = document.createElement('div');
  overlay.id = 'ios-instructions-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.98) 0%, rgba(0, 0, 0, 0.95) 100%);
    backdrop-filter: blur(12px);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  `;

  const modal = document.createElement('div');
  modal.style.cssText = `
    background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%);
    border: 1px solid rgba(255, 193, 7, 0.3);
    border-radius: 28px;
    max-width: 320px;
    width: 85%;
    padding: 32px 24px;
    text-align: center;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
    animation: fadeInUp 0.4s ease-out;
  `;

  modal.innerHTML = `
    <div style="margin-bottom: 20px;">
      <div style="
        width: 70px;
        height: 70px;
        margin: 0 auto;
        background: linear-gradient(135deg, #ffc10720 0%, #ffd54f10 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid rgba(255, 193, 7, 0.3);
      ">
        <span style="font-size: 40px;">📱</span>
      </div>
    </div>
    
    <h3 style="
      margin: 0 0 12px;
      font-size: 22px;
      font-weight: 700;
      background: linear-gradient(135deg, #ffc107 0%, #ffd54f 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    ">Open in Safari</h3>
    
    <p style="color: #b0b0b0; margin-bottom: 20px; line-height: 1.6;">
      ${platformName} browser has limitations. Follow these steps:
    </p>
    
    <div style="text-align: left; background: rgba(255,255,255,0.05); border-radius: 16px; padding: 16px; margin-bottom: 20px;">
      <div style="display: flex; align-items: center; margin-bottom: 16px;">
        <div style="
          width: 32px;
          height: 32px;
          background: rgba(255,193,7,0.2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          font-weight: bold;
          color: #ffc107;
        ">1</div>
        <span style="color: #e0e0e0;">Tap <strong style="color: #ffc107;">Copy Link</strong> button below</span>
      </div>
      <div style="display: flex; align-items: center; margin-bottom: 16px;">
        <div style="
          width: 32px;
          height: 32px;
          background: rgba(255,193,7,0.2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          font-weight: bold;
          color: #ffc107;
        ">2</div>
        <span style="color: #e0e0e0;">Open <strong style="color: #ffc107;">Safari</strong> app</span>
      </div>
      <div style="display: flex; align-items: center;">
        <div style="
          width: 32px;
          height: 32px;
          background: rgba(255,193,7,0.2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          font-weight: bold;
          color: #ffc107;
        ">3</div>
        <span style="color: #e0e0e0;">Paste link in address bar & go</span>
      </div>
    </div>
    
    <button id="ios-copy-btn" style="
      background: linear-gradient(135deg, #ffc107 0%, #ffd54f 100%);
      border: none;
      padding: 12px 28px;
      border-radius: 40px;
      font-size: 14px;
      font-weight: 700;
      color: #000000;
      cursor: pointer;
      width: 100%;
      margin-bottom: 12px;
    ">📋 Copy Link</button>
    
    <button id="ios-close-btn" style="
      background: transparent;
      border: 1.5px solid rgba(255, 255, 255, 0.2);
      padding: 10px 28px;
      border-radius: 40px;
      font-size: 13px;
      font-weight: 600;
      color: #a0a0a0;
      cursor: pointer;
      width: 100%;
    ">Close</button>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const copyBtn = modal.querySelector('#ios-copy-btn');
  const closeBtn = modal.querySelector('#ios-close-btn');
  
  copyBtn?.addEventListener('click', async () => {
    await copyToClipboard(currentUrl);
    // Show success feedback
    const originalText = copyBtn.textContent;
    copyBtn.textContent = '✓ Copied!';
    copyBtn.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.style.background = 'linear-gradient(135deg, #ffc107 0%, #ffd54f 100%)';
    }, 2000);
    
    // Also try to open Safari with the URL (works in some cases)
    setTimeout(() => {
      window.open(currentUrl, '_blank');
    }, 500);
  });
  
  closeBtn?.addEventListener('click', () => {
    overlay.remove();
  });
}

/**
 * Shows Android instructions modal with intent fallback
 */
function showAndroidInstructions(url: string): void {
  const existingOverlay = document.getElementById('android-instructions-overlay');
  if (existingOverlay) return;

  const overlay = document.createElement('div');
  overlay.id = 'android-instructions-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.98) 0%, rgba(0, 0, 0, 0.95) 100%);
    backdrop-filter: blur(12px);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  const modal = document.createElement('div');
  modal.style.cssText = `
    background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%);
    border: 1px solid rgba(255, 193, 7, 0.3);
    border-radius: 28px;
    max-width: 320px;
    width: 85%;
    padding: 32px 24px;
    text-align: center;
  `;

  modal.innerHTML = `
    <div style="margin-bottom: 20px;">
      <span style="font-size: 48px;">🔗</span>
    </div>
    <h3 style="
      margin: 0 0 12px;
      font-size: 22px;
      font-weight: 700;
      background: linear-gradient(135deg, #ffc107 0%, #ffd54f 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    ">Open in Chrome</h3>
    <p style="color: #b0b0b0; margin-bottom: 16px;">Copy this link and open in Chrome:</p>
    <div style="
      background: rgba(0,0,0,0.5);
      border-radius: 12px;
      padding: 12px;
      margin-bottom: 16px;
      word-break: break-all;
      font-size: 12px;
      color: #ffc107;
      font-family: monospace;
    ">${url}</div>
    <button id="android-copy-btn" style="
      background: linear-gradient(135deg, #ffc107 0%, #ffd54f 100%);
      border: none;
      padding: 12px 28px;
      border-radius: 40px;
      font-size: 14px;
      font-weight: 700;
      color: #000000;
      cursor: pointer;
      width: 100%;
      margin-bottom: 12px;
    ">📋 Copy Link</button>
    <button id="android-close-btn" style="
      background: transparent;
      border: 1.5px solid rgba(255, 255, 255, 0.2);
      padding: 10px 28px;
      border-radius: 40px;
      font-size: 13px;
      font-weight: 600;
      color: #a0a0a0;
      cursor: pointer;
      width: 100%;
    ">Close</button>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const copyBtn = modal.querySelector('#android-copy-btn');
  const closeBtn = modal.querySelector('#android-close-btn');
  
  copyBtn?.addEventListener('click', async () => {
    await copyToClipboard(url);
    const originalText = copyBtn.textContent;
    copyBtn.textContent = '✓ Copied!';
    copyBtn.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.style.background = 'linear-gradient(135deg, #ffc107 0%, #ffd54f 100%)';
    }, 2000);
  });
  
  closeBtn?.addEventListener('click', () => {
    overlay.remove();
  });
}

/**
 * Handles "Open in Browser" action with improved UX
 */
function openInExternalBrowser(platform: SocialPlatform): void {
  const currentUrl = window.location.href;
  const userAgent = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);
  
  // iOS - Always show instructions modal (can't directly open)
  if (isIOS) {
    showIOSInstructions(platform === 'facebook' ? 'Facebook' : 'Instagram');
    return;
  }

  // Android - Try intent, fallback to instructions
  if (isAndroid) {
    try {
      const urlObj = new URL(currentUrl);
      const intentUrl = `intent://${urlObj.host}${urlObj.pathname}${urlObj.search}#Intent;scheme=https;package=com.android.chrome;end;`;
      
      // Try to open with intent
      window.location.href = intentUrl;
      
      // Fallback: if still here after 500ms, show instructions
      setTimeout(() => {
        showAndroidInstructions(currentUrl);
      }, 500);
    } catch (e) {
      showAndroidInstructions(currentUrl);
    }
    return;
  }

  // Desktop fallback
  window.open(currentUrl, '_blank');
}

/**
 * Removes the modal overlay and cleans up
 */
function destroyModal(overlay: HTMLDivElement): void {
  if (overlay && overlay.parentNode) {
    overlay.parentNode.removeChild(overlay);
  }
  // Clean up any lingering instruction modals
  const iosModal = document.getElementById('ios-instructions-overlay');
  const androidModal = document.getElementById('android-instructions-overlay');
  if (iosModal) iosModal.remove();
  if (androidModal) androidModal.remove();
}

/**
 * Main initializer: Check UA, show modal if needed
 */
export function initSocialBrowserWarning(): void {
  const platform = detectSocialBrowser();
  
  // Don't show if already in Safari (means they followed instructions)
  if (platform === 'none' || isSafari()) {
    return;
  }

  // Store platform in localStorage to prevent showing too often
  const lastShown = localStorage.getItem(`social_browser_warning_${platform}_v2`);
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  if (lastShown && (now - parseInt(lastShown)) < ONE_DAY) {
    return; // Don't show again for 24 hours
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => showModalAndAttach(platform));
  } else {
    showModalAndAttach(platform);
  }
}

/**
 * Creates modal, attaches button events
 */
function showModalAndAttach(platform: SocialPlatform): void {
  const { overlay, openButton, cancelButton } = createModal(platform);

  const originalOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  // Store last shown time
  localStorage.setItem(`social_browser_warning_${platform}_v2`, Date.now().toString());

  const cleanup = () => {
    document.body.style.overflow = originalOverflow;
    destroyModal(overlay);
  };

  openButton?.addEventListener('click', (e) => {
    e.preventDefault();
    openInExternalBrowser(platform);
    cleanup();
  });

  cancelButton?.addEventListener('click', (e) => {
    e.preventDefault();
    cleanup();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      cleanup();
    }
  });
}

// Auto-initialize
if (typeof window !== 'undefined') {
  // Small delay to ensure all scripts are loaded
  setTimeout(() => {
    initSocialBrowserWarning();
  }, 100);
}