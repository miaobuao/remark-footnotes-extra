import { defineConfig } from 'tsup'

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['esm', 'cjs'],
	target: 'es2022',
	dts: true,
	clean: true,
	// Keep the CJS entry usable on Node versions without require(ESM).
	noExternal: ['unist-util-visit'],
})
