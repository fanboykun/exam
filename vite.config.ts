import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import type { PWAAssetsOptions } from 'vite-plugin-pwa';
const pwaAssets: PWAAssetsOptions = { image: 'static/favicon.svg' };

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		devtoolsJson(),
		SvelteKitPWA({
			srcDir: 'src',
			filename: 'service-worker.ts',
			strategies: 'injectManifest',
			registerType: 'prompt',
			includeAssets: ['favicon.svg'],
			pwaAssets,
			injectManifest: {
				rollupFormat: 'iife',
				globPatterns: [
					'client/**/*.{js,css,ico,png,svg,webp,woff,woff2,json}',
					'prerendered/**/*.{html,json}'
				],
				globIgnores: ['**/node_modules/**/*', '**/service-worker.ts']
			},
			manifest: {
				name: 'SvelteKit RFC Starter',
				short_name: 'RFC Starter',
				description: 'A SvelteKit starter with PWA capabilities',
				theme_color: '#3b82f6',
				background_color: '#ffffff',
				display: 'standalone',
				scope: '/',
				start_url: '/',
				icons: [
					{
						src: '/icon-192x192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: '/icon-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: '/icon-192x192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'maskable'
					},
					{
						src: '/icon-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				]
			},
			devOptions: {
				enabled: true,
				type: 'module',
				navigateFallback: '/'
			}
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					environment: 'browser',
					browser: {
						enabled: true,
						provider: 'playwright',
						instances: [{ browser: 'chromium' }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
	// define: {
	// 	'process.env.NODE_ENV': process.env.NODE_ENV === 'production' ? '"production"' : '"development"'
	// }
});
