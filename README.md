# Box Signage — Fase 1

Digital signage para boxes de CrossFit: varias TVs, WOD, imágenes de cualquier
proporción (con bandas negras, `cover` o `blur-fill`), logo del box, publicidad
rotativa y actualización en tiempo real desde el móvil.

Todo corre sobre **Cloudflare Workers + Static Assets + un Durable Object**, sin
backend tradicional ni coste adicional. El Worker sirve el build de Vite (rol de
"Pages") y expone la API/WebSocket en `/api/*`.

---

## Arquitectura

```
Navegador TV  ──WebSocket──┐
Navegador Admin ──WebSocket┤──►  Worker (worker/index.ts)
Admin POST /api/... ──HTTP──┘        │
                                     ▼
                         GymSignageDO (Durable Object, 1 por gimnasio)
                         · guarda las Screen en storage
                         · mantiene los WebSockets (con hibernación)
                         · difunde deltas a las TVs
```

- `worker/durable/GymSignageDO.ts` — estado persistente + WebSockets + broadcast.
- `src/shared/types/signage.ts` — contrato de tipos (`Screen`, `AdminCommand`, `TvEvent`).
- `src/shared/timer.ts` — cálculo local del temporizador compartido por TV y panel.
- `src/tv/` — reproductor de la tele.
- `src/admin/` — panel móvil con previsualización 16:9.
- `src/shared/hooks/` — socket con reconexión, reloj, temporizador, fullscreen, refresco nocturno.

### Flujo en tiempo real

1. Una tele se conecta a `/api/ws/:screenId?role=tv` y recibe `STATE_SYNC`.
2. El panel envía comandos por `POST /api/screens/:screenId/command`.
3. El DO persiste, actualiza `updatedAt` y difunde solo los deltas
   (`CONTENT_CHANGED`, `ADS_CHANGED`, `BRAND_CHANGED`, `TIMER_CHANGED`,
   `SCREEN_NAME_CHANGED`) a los sockets de esa pantalla.
4. El temporizador no se transmite segundo a segundo: se guarda
   `startedAt`/`pausedAt` y cada tele calcula el tiempo localmente.

---

## Puesta en marcha

```bash
npm install
```

### Desarrollo

Necesitas dos terminales:

```bash
# Terminal 1 — Worker + Durable Object (Miniflare) en :8787
npm run dev:worker

# Terminal 2 — Vite en :5173
npm run dev
```

En desarrollo, `.env.development` define `VITE_API_ORIGIN=http://localhost:8787`,
así que el navegador habla **directamente** con `wrangler dev` (API y
WebSocket) y se evitan los avisos `ws proxy socket error` del proxy de Vite.
El Worker ya envía las cabeceras CORS necesarias. Si borras esa variable, el
proxy `/api` de `vite.config.ts` (con soporte WS) sirve como alternativa.

Abre:

- Panel: http://localhost:5173/admin
- TV WOD: http://localhost:5173/tv/wod
- TV Entrada: http://localhost:5173/tv/entrada
- TV Sala 2: http://localhost:5173/tv/sala-2

### Producción

```bash
npm run build      # typecheck + build de Vite a dist/
npx wrangler deploy
```

Tras el despliegue tendrás algo como:

```
https://signage-tu-box.<subdominio>.workers.dev/tv/wod
https://signage-tu-box.<subdominio>.workers.dev/tv/entrada
https://signage-tu-box.<subdominio>.workers.dev/tv/sala-2
https://signage-tu-box.<subdominio>.workers.dev/admin
```

---

## Clave del panel

El panel admite una clave secreta compartida. Si `ADMIN_KEY` no está definida,
la API queda abierta (útil en local). Para activarla en producción:

```bash
npx wrangler secret put ADMIN_KEY
```

La clave se guarda en `localStorage` del móvil la primera vez que se introduce.
Las TVs no la necesitan.

Variables opcionales en `wrangler.jsonc`:

| Variable         | Por defecto | Descripción                                  |
| ---------------- | ----------- | -------------------------------------------- |
| `DEFAULT_GYM_ID` | `default`   | Gimnasio usado cuando no se pasa `?gym=`.    |

---

## Modelo de datos

Definido en `src/shared/types/signage.ts`. Resumen:

- `Screen`: `id`, `name`, `gymId`, `brand`, `main`, `ads`, `updatedAt`.
- `BrandConfig`: logo, color primario/secundario, fondo, mostrar reloj.
- `MainContent`: `text` | `image` | `carousel` | `timer`.
- `ImageFit`: `contain` (por defecto), `cover`, `blur-fill`.
- `AdPlaylist`: `enabled`, `items`, `secondsPerAd`, `pauseDuringTimer`.
- `TimerState`: `status`, `mode`, `workSeconds`, `restSeconds`, `rounds`,
  `currentRound`, `startedAt`, `pausedAt`.

Pantallas creadas automáticamente: `wod`, `entrada`, `sala-2`.

---

## Comportamiento ante fallos

- **Heartbeat:** PING cada 30 s; el DO registra el último latido.
- **Reconexión:** backoff de 2, 5, 10, 30 y 60 s (y al volver a la pestaña).
- **Caché local:** la tele guarda el último `STATE_SYNC` y lo muestra mientras
  resincroniza (sin pantallas en blanco).
- **Reloj local:** sigue funcionando sin red.
- **Refresco nocturno:** recarga a las 03:00 para liberar memoria del navegador.
- **Pantalla completa:** botón manual y doble clic; detecta la salida de fullscreen.

---

## Modos de imagen

| Modo        | Comportamiento                                        |
| ----------- | ----------------------------------------------------- |
| `contain`   | Imagen completa con bandas negras (por defecto).      |
| `cover`     | Rellena el marco recortando bordes.                   |
| `blur-fill` | Copia ampliada y desenfocada detrás + imagen centrada.|

Solo se aceptan URLs HTTPS; se avisa si la URL no es válida y se registran las
dimensiones reales cuando el navegador las conoce.

---

## Publicidad

Franja inferior (~20 %) con rotación automática configurable (`secondsPerAd`),
transición de entrada suave y máximo un elemento animado. Durante el
temporizador se compacta (`pauseDuringTimer`) para no competir con el cronómetro.

---

## Scripts

| Script              | Descripción                                   |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Vite dev server con proxy a la API.           |
| `npm run dev:worker`| Worker + DO en local (Miniflare).             |
| `npm run build`     | Typecheck (app + worker) y build a `dist/`.   |
| `npm run typecheck` | Typecheck de app y worker.                    |
| `npm run deploy`    | Build + `wrangler deploy`.                    |
| `npm run cf-typegen`| Genera tipos de bindings de Cloudflare.       |

---

## Roadmap (Fase 2)

Subida de imágenes a R2, usuarios, programación horaria, plantillas y
monitorización. El campo `url` pasará a apuntar a R2 sin cambios en el player.
