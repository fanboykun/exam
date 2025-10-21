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
			strategies: 'generateSW',
			registerType: 'autoUpdate',
			includeAssets: ['favicon.svg'],
			pwaAssets,
			workbox: {
				globPatterns: ['client/**/*.{js,css,html,ico,png,svg,webp,woff,woff2,json,webmanifest}'],
				runtimeCaching: [
					// google font caching
					{
						urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'google-fonts-cache',
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365
							},
							cacheableResponse: {
								statuses: [0, 200]
							}
						}
					},
					// google assets caching
					{
						urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'gstatic-fonts-cache',
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365
							},
							cacheableResponse: {
								statuses: [0, 200]
							}
						}
					},
					// image caching
					{
						handler: 'CacheFirst',
						urlPattern: (e) => {
							return e.url.toString().match(/\.(jpg|jpeg|gif|png|svg|ico)/);
						},
						options: {
							cacheName: 'images-cache',
							cacheableResponse: {
								statuses: [0, 200]
							}
						}
					},
					// cache remote funcitons query
					{
						urlPattern: ({ url }) => {
							return url.pathname.includes('/_app/remote/');
						},
						method: 'GET',
						handler: 'NetworkFirst',
						options: {
							cacheName: 'remote-functions-cache',
							cacheableResponse: {
								statuses: [0, 200]
							}
						}
					},
					// queue and sync remote functions command
					{
						urlPattern: ({ url }) => {
							return url.pathname.includes('/_app/remote/');
						},
						method: 'POST',
						handler: 'NetworkOnly',
						options: {
							backgroundSync: {
								name: 'remote-functions-queue-POST',
								options: {
									maxRetentionTime: 24 * 60,
									forceSyncFallback: true
								}
							}
						}
					}
				]
			},
			manifest: {
				name: 'SvelteKit RFC Starter',
				short_name: 'RFC Starter',
				description: 'A SvelteKit starter with PWA capabilities',
				theme_color: '#3b82f6',
				background_color: '#ffffff',
				display: 'standalone',
				scope: '/',
				start_url: '/'
			},
			devOptions: {
				enabled: true
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
});
