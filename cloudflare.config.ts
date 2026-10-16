import { bindings, defineConfig, exports } from "cf/config";

export default defineConfig({
  worker: {
    name: "boxtv",
    compatibilityDate: "2025-01-15",
    compatibilityFlags: ["nodejs_compat"],
    entrypoint: "worker/index.ts",
    observability: {
      enabled: true,
    },
    assets: {
      notFoundHandling: "single-page-application",
      runWorkerFirst: true,
    },
    env: {
      // Fase 1: contraseña en claro para que `cf deploy` no pida fichero de
      // secretos. Ojo: el valor queda visible en el dashboard de Cloudflare
      // (vars del Worker) y en este fichero. Antes de abrir el box al público,
      // vuelve a `bindings.secret()` y despliega con `--secrets-file`.
      // Se puede cambiar por otro valor cuando quieras (y volver a desplegar).
      ADMIN_KEY: bindings.text("7NMeXzkzh51c2sxmL2JE"),
      DEFAULT_GYM_ID: bindings.text("default"),
      GYM_SIGNAGE: bindings.durableObject({
        worker: "boxtv",
        exportName: "GymSignageDO",
      }),
      // Imágenes en Backblaze B2 (S3-compatible).
      // - Las dos credenciales son secretos: en local van en `.dev.vars`; en
      //   producción se suben con `cf deploy --secrets-file .secrets.env`.
      // - El bucket y la región van AQUÍ como texto fijo (no son sensibles).
      //   Ojo: al ser un valor literal, `.dev.vars` NO los sobreescribe; si
      //   cambias de bucket/región, edítalos en este fichero.
      B2_KEY_ID: bindings.secret(),
      B2_APPLICATION_KEY: bindings.secret(),
      B2_BUCKET: bindings.text("boxtv-media"),
      // Región del endpoint S3 del bucket (B2 → bucket → "Endpoint",
      // p. ej. s3.eu-central-003.backblazeb2.com → eu-central-003).
      B2_REGION: bindings.text("eu-central-003"),
      ASSETS: bindings.assets(),
    },
    exports: {
      GymSignageDO: exports.durableObject({ storage: "sqlite" }),
    },
  },
});
