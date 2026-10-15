// ---------------------------------------------------------------------------
// Admin-key transport for the WebSocket handshake.
//
// Browsers cannot set custom headers on `new WebSocket(...)`, so the key used
// to live in the query string (`?key=…`), where it leaked into URLs, logs and
// proxies. Instead we pass it as a WebSocket subprotocol (`Sec-WebSocket-
// Protocol`), which is sent as a header and never appears in the URL. The value
// must be a valid token, so the key is base64url-encoded behind a prefix.
//
// Shared by the client (offer) and the Worker (verify/echo).
// ---------------------------------------------------------------------------

export const WS_KEY_PREFIX = 'signage-key.';

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Encodes an admin key as a `Sec-WebSocket-Protocol` token. */
export function encodeWsKey(key: string): string {
  const base64 = bytesToBase64(new TextEncoder().encode(key));
  const urlSafe = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${WS_KEY_PREFIX}${urlSafe}`;
}

/** Decodes a subprotocol back into the admin key, or `null` if it is not one. */
export function decodeWsKey(protocol: string): string | null {
  if (!protocol.startsWith(WS_KEY_PREFIX)) return null;
  let base64 = protocol.slice(WS_KEY_PREFIX.length).replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  try {
    return new TextDecoder().decode(base64ToBytes(base64));
  } catch {
    return null;
  }
}
