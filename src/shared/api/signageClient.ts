import type { AdminCommand, Screen, ScreenRuntimeStatus } from '../types/signage';

const ADMIN_KEY_STORAGE = 'signage.adminKey';
const GYM_STORAGE = 'signage.gymId';

/**
 * Optional API origin. When empty the app talks to its own origin, which is
 * both production and `cf dev` (the Cloudflare Vite plugin serves the client
 * and the Worker together). Can still be overridden with `VITE_API_ORIGIN`.
 */
const API_ORIGIN = ((import.meta.env.VITE_API_ORIGIN as string | undefined) ?? '').replace(
  /\/$/,
  '',
);

export function getApiOrigin(): string {
  return API_ORIGIN;
}

export function getAdminKey(): string {
  try {
    return localStorage.getItem(ADMIN_KEY_STORAGE) ?? '';
  } catch {
    return '';
  }
}

export function setAdminKey(key: string): void {
  try {
    if (key) localStorage.setItem(ADMIN_KEY_STORAGE, key);
    else localStorage.removeItem(ADMIN_KEY_STORAGE);
  } catch {
    // ignore storage failures (private mode)
  }
}

export function getGymId(): string {
  try {
    return localStorage.getItem(GYM_STORAGE) ?? '';
  } catch {
    return '';
  }
}

export function setGymId(gymId: string): void {
  try {
    if (gymId) localStorage.setItem(GYM_STORAGE, gymId);
    else localStorage.removeItem(GYM_STORAGE);
  } catch {
    // ignore
  }
}

function withGym(url: string): string {
  const gym = getGymId();
  if (!gym) return url;
  const u = new URL(url, window.location.origin);
  u.searchParams.set('gym', gym);
  return u.pathname + u.search;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const key = getAdminKey();
  if (key) headers.set('X-Admin-Key', key);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_ORIGIN}${withGym(path)}`, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with ${res.status}`);
  }
  return (await res.json()) as T;
}

export const signageClient = {
  health() {
    return request<{ ok: boolean; ts: number }>('/api/health');
  },

  getScreen(screenId: string) {
    return request<{ screen: Screen }>(`/api/screen/${encodeURIComponent(screenId)}`);
  },

  listScreens() {
    return request<{
      gymId: string;
      updatedAt: number;
      screens: Screen[];
      statuses: ScreenRuntimeStatus[];
    }>('/api/screens');
  },

  sendCommand(screenId: string, command: AdminCommand) {
    return request<{ ok: boolean; screen: Screen }>(
      `/api/screens/${encodeURIComponent(screenId)}/command`,
      { method: 'POST', body: JSON.stringify({ screenId, command }) },
    );
  },
};

export function wsUrl(screenId: string, role: 'tv' | 'admin'): string {
  const origin = API_ORIGIN || window.location.origin;
  const url = new URL(withGym(`/api/ws/${encodeURIComponent(screenId)}`), origin);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.searchParams.set('role', role);
  if (role === 'admin') {
    const key = getAdminKey();
    if (key) url.searchParams.set('key', key);
  }
  return url.toString();
}
