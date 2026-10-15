import { useEffect, useState } from 'react';
import type { Screen, TvEvent } from '../types/signage';
import { wsUrl } from '../api/signageClient';

export type ConnectionStatus = 'connecting' | 'open' | 'closed';

export type UseScreenSocketResult = {
  screen: Screen | null;
  status: ConnectionStatus;
  lastSync: number | null;
};

const BACKOFF_STEPS = [2000, 5000, 10000, 30000, 60000];

/**
 * Connects to the screen's realtime channel.
 *
 * - TV role: caches the last STATE_SYNC in localStorage so it can render
 *   instantly after a reload/reconnect.
 * - Reconnects with exponential backoff (2, 5, 10, 30, 60s).
 * - Sends a PING every 30s so the DO can track liveness.
 */
export function useScreenSocket(
  screenId: string,
  role: 'tv' | 'admin',
  enabled = true,
): UseScreenSocketResult {
  const [screen, setScreen] = useState<Screen | null>(() =>
    role === 'tv' ? readCachedScreen(screenId) : null,
  );
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [lastSync, setLastSync] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled || !screenId) return;

    let socket: WebSocket | null = null;
    let closedByUs = false;
    let heartbeat: ReturnType<typeof setInterval> | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    const connect = () => {
      setStatus('connecting');
      socket = new WebSocket(wsUrl(screenId, role));

      socket.onopen = () => {
        attempt = 0;
        setStatus('open');
        heartbeat = setInterval(() => {
          if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'PING', ts: Date.now() }));
          }
        }, 30_000);
      };

      socket.onmessage = (event) => {
        if (typeof event.data !== 'string') return;
        let message: TvEvent;
        try {
          message = JSON.parse(event.data) as TvEvent;
        } catch {
          return;
        }
        setLastSync(Date.now());
        setScreen((current) => applyEvent(message, current));
      };

      socket.onclose = () => {
        if (heartbeat) {
          clearInterval(heartbeat);
          heartbeat = null;
        }
        socket = null;
        if (closedByUs) return;
        setStatus('closed');
        const delay = BACKOFF_STEPS[Math.min(attempt, BACKOFF_STEPS.length - 1)];
        attempt += 1;
        reconnectTimer = setTimeout(connect, delay);
      };

      socket.onerror = () => socket?.close();
    };

    connect();

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && socket === null && !closedByUs) {
        if (reconnectTimer) clearTimeout(reconnectTimer);
        attempt = 0;
        connect();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      closedByUs = true;
      document.removeEventListener('visibilitychange', onVisibility);
      if (heartbeat) clearInterval(heartbeat);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [screenId, role, enabled]);

  // Persist the last known state so the TV never flashes a blank screen.
  useEffect(() => {
    if (role === 'tv' && screen) writeCachedScreen(screen);
  }, [role, screen]);

  return { screen, status, lastSync };
}

function applyEvent(event: TvEvent, current: Screen | null): Screen | null {
  if (event.type === 'PONG') return current;
  if (event.type === 'STATE_SYNC') return event.screen;
  if (!current) return current;

  switch (event.type) {
    case 'CONTENT_CHANGED':
      return { ...current, main: event.main, updatedAt: Date.now() };
    case 'ADS_CHANGED':
      return { ...current, ads: event.ads, updatedAt: Date.now() };
    case 'BRAND_CHANGED':
      return { ...current, brand: event.brand, updatedAt: Date.now() };
    case 'SCREEN_NAME_CHANGED':
      return { ...current, name: event.name, updatedAt: Date.now() };
    case 'TIMER_CHANGED':
      if (current.main.type !== 'timer') return current;
      return { ...current, main: { type: 'timer', timer: event.timer }, updatedAt: Date.now() };
    default:
      return current;
  }
}

// --------------------------- TV localStorage cache -------------------------

function cacheKey(screenId: string): string {
  return `signage.screen.${screenId}`;
}

function readCachedScreen(screenId: string): Screen | null {
  try {
    const raw = localStorage.getItem(cacheKey(screenId));
    return raw ? (JSON.parse(raw) as Screen) : null;
  } catch {
    return null;
  }
}

function writeCachedScreen(screen: Screen): void {
  try {
    localStorage.setItem(cacheKey(screen.id), JSON.stringify(screen));
  } catch {
    // ignore quota errors
  }
}
