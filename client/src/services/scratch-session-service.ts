/**
 * Scratch Session Service
 * Handles scratch card session API calls with keepalive to ensure
 * balance credits complete even if component unmounts or user navigates away
 */

// Track pending completions to ensure they finish even if page unloads
const pendingCompletions = new Set<Promise<any>>();

export interface ScratchSessionResponse {
  success: boolean;
  sessionId: string;
  isWinner: boolean;
  prize: {
    type: string;
    value: string;
  };
  tileLayout: number[];
  prizeId: string;
}

export interface CompleteSessionPayload {
  orderId: string;
  prizeId: string;
  isWinner: boolean;
}

export interface CompleteSessionResponse {
  success: boolean;
  prize: {
    type: string;
    value: string;
  };
  prizeLabel?: string;
  remainingCards: number;
  orderId: string;
}

/**
 * Start a new scratch session
 * Returns pre-determined prize and tile layout from server
 */
export async function startSession(orderId: string): Promise<ScratchSessionResponse> {
  const response = await fetch('/api/scratch-session/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
    credentials: 'include',
    // keepalive ensures request completes even if page unloads
    keepalive: true,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to start scratch session');
  }

  return response.json();
}

/**
 * Complete scratch session - credits balance and records win
 * Uses keepalive to ensure backend transaction completes even if user navigates away
 */
export async function completeSession(
  sessionId: string,
  payload: CompleteSessionPayload
): Promise<CompleteSessionResponse> {
  const completionPromise = fetch(`/api/scratch-session/${sessionId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
    // ✅ CRITICAL: keepalive ensures balance credits even if component unmounts
    keepalive: true,
  }).then(async (response) => {
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to complete scratch session');
    }
    return response.json();
  });

  // Track pending completion
  pendingCompletions.add(completionPromise);
  
  try {
    const result = await completionPromise;
    return result;
  } finally {
    // Remove from pending set when done
    pendingCompletions.delete(completionPromise);
  }
}

/**
 * Check if there are any pending completion requests
 * Useful for preventing navigation before completions finish
 */
export function hasPendingCompletions(): boolean {
  return pendingCompletions.size > 0;
}

/**
 * Wait for all pending completions to finish
 * Call this before critical navigation to ensure all balances are credited
 */
export async function waitForPendingCompletions(): Promise<void> {
  if (pendingCompletions.size === 0) return;
  await Promise.allSettled(Array.from(pendingCompletions));
}

// Optional: Listen to page visibility changes to log pending completions
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && pendingCompletions.size > 0) {
      console.warn(`⚠️ Page hiding with ${pendingCompletions.size} pending scratch completions`);
    }
  });

  window.addEventListener('pagehide', () => {
    if (pendingCompletions.size > 0) {
      console.warn(`⚠️ Page unloading with ${pendingCompletions.size} pending scratch completions - keepalive should ensure they complete`);
    }
  });
}
