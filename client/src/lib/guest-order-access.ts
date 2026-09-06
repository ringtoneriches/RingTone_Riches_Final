const guestOrderTokenKey = (orderId: string) => `guest_order_token_${orderId}`;

export function saveGuestOrderToken(orderId: string, token: string) {
  if (!orderId || !token) return;
  localStorage.setItem(guestOrderTokenKey(orderId), token);
}

export function getGuestOrderToken(orderId: string | undefined): string | null {
  if (!orderId) return null;
  const urlToken = new URLSearchParams(window.location.search).get("token");
  if (urlToken) {
    saveGuestOrderToken(orderId, urlToken);
    return urlToken;
  }
  return localStorage.getItem(guestOrderTokenKey(orderId));
}

export function guestOrderRequestInit(
  orderId: string | undefined,
  init: RequestInit = {},
): RequestInit {
  const token = getGuestOrderToken(orderId);
  if (!token) return init;
  const headers = new Headers(init.headers);
  headers.set("X-Guest-Order-Token", token);
  return { ...init, headers };
}

export function guestOrderApiUrl(orderId: string, path: string): string {
  const token = getGuestOrderToken(orderId);
  if (!token) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}token=${encodeURIComponent(token)}`;
}
