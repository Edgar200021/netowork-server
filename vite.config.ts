import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		testTimeout: 150_000,
		hookTimeout: 120_000,
		fileParallelism: false,
		poolOptions: {
			threads: {
				isolate: true,
			},
		},
	},
});
