import { defineConfig } from '@rsbuild/core'
import { pluginVue } from '@rsbuild/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import unimport from 'unimport/unplugin'

export default defineConfig({
	plugins: [pluginVue()],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
	tools: {
		rspack: {
			module: {
				rules: [
					{
						test: /\.css$/,
						use: [
							{
								loader: 'postcss-loader',
								options: {
									postcssOptions: {
										plugins: {
											tailwindcss: {},
											autoprefixer: {},
										},
									},
								},
							},
						],
						// type: 'css',
					},
				],
			},
			plugins: [
				unimport.rspack({
					presets: ['vue', '@vueuse/core'],
					dirs: ['./src/components/ui/**/*.ts', './src/utils/**/*.ts'],
					dts: true,
				}),
			],
		},
	},
})
