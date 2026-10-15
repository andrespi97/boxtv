import { bindings, defineConfig, exports } from "cf/config";

export default defineConfig({
	worker: {
		name: "signage-box",
		compatibilityDate: "2025-01-15",
		compatibilityFlags: [
			"nodejs_compat",
		],
		entrypoint: "worker/index.ts",
		observability: {
			enabled: true,
		},
		assets: {
			notFoundHandling: "single-page-application",
			runWorkerFirst: true,
		},
		env: {
			DEFAULT_GYM_ID: bindings.text("default"),
			GYM_SIGNAGE: bindings.durableObject({
				worker: "signage-box",
				exportName: "GymSignageDO",
			}),
			ASSETS: bindings.assets(),
		},
		exports: {
			GymSignageDO: exports.durableObject({ storage: "sqlite" }),
		},
	},
});
