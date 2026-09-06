export const CONFIRM_SCREEN_MS = 2000;

export function waitConfirmScreen(startedAt = Date.now()) {
  const left = CONFIRM_SCREEN_MS - (Date.now() - startedAt);
  return left > 0 ? new Promise<void>((resolve) => window.setTimeout(resolve, left)) : Promise.resolve();
}
