import { GymSignageDO } from './durable/GymSignageDO';
import { CORS_HEADERS, type Env } from './env';

export { GymSignageDO };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (url.pathname.startsWith('/api/')) {
      try {
        return await handleApi(request, env, url);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return json({ error: message }, 500);
      }
    }

    // Everything else is served from the static build (Pages / Workers assets).
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

async function handleApi(request: Request, env: Env, url: URL): Promise<Response> {
  const { pathname } = url;

  if (pathname === '/api/health') {
    return json({ ok: true, service: 'signage-box', ts: Date.now() });
  }

  const gymId = url.searchParams.get('gym') || env.DEFAULT_GYM_ID || 'default';
  const stub = env.GYM_SIGNAGE.get(env.GYM_SIGNAGE.idFromName(gymId));

  // WebSocket upgrade: /api/ws/:screenId?role=tv|admin
  const wsMatch = pathname.match(/^\/api\/ws\/([^/]+)$/);
  if (wsMatch) {
    const role = url.searchParams.get('role') === 'admin' ? 'admin' : 'tv';
    if (role === 'admin' && !isAuthorized(request, env, url)) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const doUrl = new URL('https://do/ws');
    doUrl.searchParams.set('screenId', decodeURIComponent(wsMatch[1]));
    doUrl.searchParams.set('role', role);
    return stub.fetch(doUrl.toString(), request);
  }

  // Public screen state: /api/screen/:screenId
  const screenMatch = pathname.match(/^\/api\/screen\/([^/]+)$/);
  if (screenMatch && request.method === 'GET') {
    const doUrl = new URL('https://do/state');
    doUrl.searchParams.set('screenId', decodeURIComponent(screenMatch[1]));
    const res = await stub.fetch(doUrl.toString());
    const body = await res.json();
    return json(body, res.status);
  }

  // Admin: list all screens + live statuses.
  if (pathname === '/api/screens' && request.method === 'GET') {
    if (!isAuthorized(request, env, url)) return json({ error: 'Unauthorized' }, 401);
    const res = await stub.fetch('https://do/screens');
    const body = await res.json();
    return json(body, res.status);
  }

  // Admin: send a command to a screen.
  const cmdMatch = pathname.match(/^\/api\/screens\/([^/]+)\/command$/);
  if (cmdMatch && request.method === 'POST') {
    if (!isAuthorized(request, env, url)) return json({ error: 'Unauthorized' }, 401);
    const payload = await request.text();
    const doUrl = new URL('https://do/command');
    doUrl.searchParams.set('screenId', decodeURIComponent(cmdMatch[1]));
    const res = await stub.fetch(doUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    });
    const body = await res.json();
    return json(body, res.status);
  }

  return json({ error: 'Not found' }, 404);
}

function isAuthorized(request: Request, env: Env, url: URL): boolean {
  if (!env.ADMIN_KEY) return true; // no key configured -> open (dev)
  const headerKey = request.headers.get('x-admin-key');
  const queryKey = url.searchParams.get('key');
  return headerKey === env.ADMIN_KEY || queryKey === env.ADMIN_KEY;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}
