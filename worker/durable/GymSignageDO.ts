import type {
  AdminCommand,
  ConnectionRole,
  Screen,
  ScreenRuntimeStatus,
  TvEvent,
} from '../../src/shared/types/signage';
import {
  createDefaultScreen,
  DEFAULT_SCREEN_IDS,
  timerFromConfig,
} from '../../src/shared/defaults';
import { parseAdminCommand } from '../commandValidation';

interface Env {
  DEFAULT_GYM_ID?: string;
}

type Attachment = {
  screenId: string;
  role: ConnectionRole;
  connectedAt: number;
  lastSeen: number | null;
};

const SCREENS_KEY = 'screens';
const screenKey = (id: string) => `screen:${id}`;

/**
 * A box has a single tele, so the app only ever ships the ids in
 * `DEFAULT_SCREEN_IDS`. Any other id — a typo, or a stale link such as
 * `/admin/admin` — resolves to the shipped screen instead of silently
 * creating a second, empty one.
 */
function resolveScreenId(raw: string | null | undefined): string {
  const fallback = DEFAULT_SCREEN_IDS[0];
  if (!raw) return fallback;
  return (DEFAULT_SCREEN_IDS as readonly string[]).includes(raw) ? raw : fallback;
}

const SEED_VERSION_KEY = 'seedVersion';
/** Bumped whenever the stored screen set has to be reconciled on boot. */
const SEED_VERSION = 3;

/**
 * One Durable Object per gym. It keeps:
 *  - the persisted `Screen` objects keyed by screen id,
 *  - the live WebSocket connections (TV players + admin panels),
 *  - and broadcasts deltas whenever an admin command mutates state.
 *
 * WebSockets use the hibernation API so idle TVs don't keep the DO awake.
 */
export class GymSignageDO implements DurableObject {
  private readonly state: DurableObjectState;
  private readonly gymId: string;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.gymId = state.id.name || env.DEFAULT_GYM_ID || 'default';
  }

  // ------------------------------- Routing --------------------------------

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const route = `${request.method} ${url.pathname}`;

    switch (route) {
      case 'GET /ws':
        return this.handleWebSocket(url);
      case 'GET /state':
        return this.handleGetState(url);
      case 'GET /screens':
        return this.handleListScreens();
      case 'POST /command':
        return this.handleCommand(url, request);
      default:
        return json({ error: 'Not found', route }, 404);
    }
  }

  // ------------------------------ WebSocket --------------------------------

  private async handleWebSocket(url: URL): Promise<Response> {
    const screenId = resolveScreenId(url.searchParams.get('screenId'));
    const role: ConnectionRole = url.searchParams.get('role') === 'admin' ? 'admin' : 'tv';

    const screen = await this.getOrCreateScreen(screenId);
    const subprotocol = url.searchParams.get('subprotocol');

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.state.acceptWebSocket(server);
    const attachment: Attachment = {
      screenId,
      role,
      connectedAt: Date.now(),
      lastSeen: null,
    };
    server.serializeAttachment(attachment);

    this.send(server, { type: 'STATE_SYNC', screen });

    // Echo the accepted subprotocol so the browser completes the handshake.
    return new Response(null, {
      status: 101,
      webSocket: client,
      headers: subprotocol ? { 'Sec-WebSocket-Protocol': subprotocol } : undefined,
    });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== 'string') return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(message);
    } catch {
      return;
    }

    const attachment = (ws.deserializeAttachment() as Attachment | null) ?? null;
    if (!attachment) return;

    const msg = parsed as { type?: string };

    if (msg.type === 'PING') {
      attachment.lastSeen = Date.now();
      ws.serializeAttachment(attachment);
      this.send(ws, { type: 'PONG', ts: Date.now() });
      return;
    }

    if (msg.type === 'STATE_REQUEST') {
      const screen = await this.getOrCreateScreen(attachment.screenId);
      this.send(ws, { type: 'STATE_SYNC', screen });
      return;
    }

    if (attachment.role === 'admin' && typeof msg.type === 'string') {
      const command = parseAdminCommand(parsed);
      if (command) await this.dispatchCommand(attachment.screenId, command);
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    try {
      ws.close(1000, 'closed');
    } catch {
      // already closed
    }
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    try {
      ws.close(1011, 'error');
    } catch {
      // already closed
    }
  }

  // ------------------------------- Commands --------------------------------

  private async handleCommand(url: URL, request: Request): Promise<Response> {
    const body = (await request.json()) as { screenId?: unknown; command?: unknown };
    // The screen id in the URL (set by the Worker from the request path) is the
    // source of truth; the body field is only a fallback.
    const screenId = resolveScreenId(
      url.searchParams.get('screenId') ??
        (typeof body.screenId === 'string' ? body.screenId : null),
    );
    const command = parseAdminCommand(body.command);
    if (!command) {
      return json({ error: 'A valid command is required' }, 400);
    }
    const { screen } = await this.dispatchCommand(screenId, command);
    return json({ ok: true, screen });
  }

  private async dispatchCommand(
    screenId: string,
    command: AdminCommand,
  ): Promise<{ screen: Screen; events: TvEvent[] }> {
    const screen = await this.getOrCreateScreen(screenId);
    const now = Date.now();
    const events: TvEvent[] = [];

    switch (command.type) {
      case 'SET_BRAND':
        screen.brand = command.brand;
        events.push({ type: 'BRAND_CHANGED', brand: command.brand, updatedAt: now });
        break;

      case 'SET_MAIN':
        screen.main = command.content;
        events.push({ type: 'CONTENT_CHANGED', main: command.content, updatedAt: now });
        if (command.content.type === 'timer') {
          events.push({ type: 'TIMER_CHANGED', timer: command.content.timer, updatedAt: now });
        }
        break;

      case 'SET_ADS':
        screen.ads = command.ads;
        events.push({ type: 'ADS_CHANGED', ads: command.ads, updatedAt: now });
        break;

      case 'START_TIMER': {
        const timer = timerFromConfig(command.config, now);
        screen.main = { type: 'timer', timer };
        events.push({ type: 'TIMER_CHANGED', timer, updatedAt: now });
        events.push({ type: 'CONTENT_CHANGED', main: screen.main, updatedAt: now });
        break;
      }

      case 'PAUSE_TIMER':
      case 'RESUME_TIMER':
      case 'STOP_TIMER':
      case 'RESET_TIMER': {
        if (screen.main.type !== 'timer') break;
        const timer = { ...screen.main.timer };
        let changed = false;
        if (command.type === 'PAUSE_TIMER' && timer.status === 'running') {
          timer.status = 'paused';
          timer.pausedAt = now;
          changed = true;
        } else if (command.type === 'RESUME_TIMER' && timer.status === 'paused') {
          if (timer.pausedAt && timer.startedAt) {
            timer.startedAt += now - timer.pausedAt;
          }
          timer.pausedAt = null;
          timer.status = 'running';
          changed = true;
        } else if (
          command.type === 'STOP_TIMER' &&
          (timer.status === 'running' || timer.status === 'paused')
        ) {
          timer.status = 'finished';
          timer.pausedAt = null;
          changed = true;
        } else if (command.type === 'RESET_TIMER' && timer.status !== 'idle') {
          timer.status = 'idle';
          timer.startedAt = null;
          timer.pausedAt = null;
          timer.currentRound = 1;
          changed = true;
        }
        // A no-op timer command (e.g. pausing an idle timer) changes nothing.
        if (!changed) break;
        screen.main = { type: 'timer', timer };
        events.push({ type: 'TIMER_CHANGED', timer, updatedAt: now });
        events.push({ type: 'CONTENT_CHANGED', main: screen.main, updatedAt: now });
        break;
      }

      case 'SET_SCREEN_NAME':
        screen.name = command.name;
        events.push({ type: 'SCREEN_NAME_CHANGED', name: command.name, updatedAt: now });
        break;
    }

    // Ignore unknown commands and no-ops (e.g. pausing an idle timer) so they
    // don't bump `updatedAt` or rewrite storage.
    if (events.length === 0) return { screen, events };

    screen.updatedAt = now;
    await this.saveScreen(screen);
    this.broadcast(screenId, events);
    return { screen, events };
  }

  // -------------------------------- Reads ----------------------------------

  private async handleGetState(url: URL): Promise<Response> {
    const screenId = resolveScreenId(url.searchParams.get('screenId'));
    const screen = await this.getOrCreateScreen(screenId);
    return json({ screen });
  }

  private async handleListScreens(): Promise<Response> {
    await this.ensureSeed();
    const ids = (await this.state.storage.get<string[]>(SCREENS_KEY)) ?? [];
    const screens = await Promise.all(ids.map((id) => this.getOrCreateScreen(id)));

    const connections = this.state.getWebSockets();
    const runtime = new Map<string, ScreenRuntimeStatus>();
    for (const id of ids) {
      runtime.set(id, {
        screenId: id,
        connected: false,
        tvConnections: 0,
        adminConnections: 0,
        lastSeen: null,
      });
    }
    for (const ws of connections) {
      const att = ws.deserializeAttachment() as Attachment | null;
      if (!att) continue;
      const status = runtime.get(att.screenId);
      if (!status) continue;
      if (att.role === 'tv') status.tvConnections += 1;
      else status.adminConnections += 1;
      status.connected = status.tvConnections > 0;
      if (att.lastSeen && (!status.lastSeen || att.lastSeen > status.lastSeen)) {
        status.lastSeen = att.lastSeen;
      }
    }

    return json({
      gymId: this.gymId,
      updatedAt: Date.now(),
      screens,
      statuses: Array.from(runtime.values()),
    });
  }

  // ------------------------------- Storage ---------------------------------

  private async ensureSeed(): Promise<void> {
    const stored = await this.state.storage.get<string[]>(SCREENS_KEY);
    if (!stored) {
      await this.state.storage.put(SCREENS_KEY, [...DEFAULT_SCREEN_IDS]);
      await Promise.all(
        DEFAULT_SCREEN_IDS.map((id) =>
          this.state.storage.put(screenKey(id), createDefaultScreen(id, this.gymId)),
        ),
      );
      await this.state.storage.put(SEED_VERSION_KEY, SEED_VERSION);
      return;
    }

    // One-time migration: the box is a single tele, so drop every screen the
    // app no longer ships (`entrada`, `sala-2`, or any stray id created by an
    // old link such as `/admin/admin`).
    const version = (await this.state.storage.get<number>(SEED_VERSION_KEY)) ?? 1;
    if (version >= SEED_VERSION) return;

    const shipped = new Set<string>(DEFAULT_SCREEN_IDS);
    const kept = stored.filter((id) => shipped.has(id));
    const dropped = stored.filter((id) => !shipped.has(id));
    for (const id of dropped) {
      await this.state.storage.delete(screenKey(id));
    }
    if (dropped.length > 0) await this.state.storage.put(SCREENS_KEY, kept);
    await this.state.storage.put(SEED_VERSION_KEY, SEED_VERSION);
  }

  private async getOrCreateScreen(rawScreenId: string): Promise<Screen> {
    const screenId = resolveScreenId(rawScreenId);
    await this.ensureSeed();
    const existing = await this.state.storage.get<Screen>(screenKey(screenId));
    if (existing) return existing;

    const ids = (await this.state.storage.get<string[]>(SCREENS_KEY)) ?? [];
    if (!ids.includes(screenId)) {
      ids.push(screenId);
      await this.state.storage.put(SCREENS_KEY, ids);
    }
    const screen = createDefaultScreen(screenId, this.gymId);
    await this.state.storage.put(screenKey(screenId), screen);
    return screen;
  }

  private async saveScreen(screen: Screen): Promise<void> {
    await this.state.storage.put(screenKey(screen.id), screen);
  }

  // ----------------------------- Broadcast ---------------------------------

  private broadcast(screenId: string, events: TvEvent[]): void {
    if (events.length === 0) return;
    for (const ws of this.state.getWebSockets()) {
      const att = ws.deserializeAttachment() as Attachment | null;
      if (!att || att.screenId !== screenId) continue;
      for (const event of events) {
        this.send(ws, event);
      }
    }
  }

  private send(ws: WebSocket, event: TvEvent): void {
    try {
      ws.send(JSON.stringify(event));
    } catch {
      // socket is gone; hibernation cleanup will handle it
    }
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
