export interface Env {
  /** Durable Object namespace: one DO instance per gym. */
  GYM_SIGNAGE: DurableObjectNamespace;
  /** Static asset fetcher (Cloudflare Pages / Workers static assets). */
  ASSETS: Fetcher;
  /** Optional shared secret required by the admin panel. */
  ADMIN_KEY?: string;
  /** Gym used when no `?gym=` query param is provided. */
  DEFAULT_GYM_ID?: string;
}

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,X-Admin-Key',
};
