import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cloudflare } from '@cloudflare/vite-plugin';
import path from 'node:path';

// The Cloudflare Vite plugin runs the Worker (API + Durable Object +
// WebSockets) and serves the client build from the same origin, so no
// proxy is needed. `cf dev` / `cf build` / `cf deploy` drive this config.
export default defineConfig({
  plugins: [react(), cloudflare()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  server: {
    port: 5173,
  },
});
