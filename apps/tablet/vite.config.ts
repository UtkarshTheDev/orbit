import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		tanstackRouter({
			target: "react",
			autoCodeSplitting: true,
		}),
		tailwindcss(),
		VitePWA({
			registerType: "autoUpdate",
			includeAssets: [
				"favicon.svg",
				"robots.txt",
				"apple-touch-icon.png",
				"models/**/*.glb",
				"models/**/*.gltf",
				"models/**/*.jpg",
				"models/**/*.png",
			],
			manifest: {
				name: "Orbit",
				short_name: "Orbit",
				description: "Orbit Robo for School Science Exhibition",
				theme_color: "#ffffff",
				background_color: "#ffffff",
				display: "standalone",
				start_url: "/",
				icons: [
					{
						src: "/pwa-192x192.png",
						sizes: "192x192",
						type: "image/png",
					},
					{
						src: "/pwa-512x512.png",
						sizes: "512x512",
						type: "image/png",
					},
				],
			},
			workbox: {
				globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2}"],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
						handler: "CacheFirst",
						options: {
							cacheName: "google-fonts-cache",
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
							},
							cacheableResponse: {
								statuses: [0, 200],
							},
						},
					},
					{
						urlPattern: /\/models\/.*\.(glb|gltf)$/i,
						handler: "CacheFirst",
						options: {
							cacheName: "3d-models-cache",
							expiration: {
								maxEntries: 20,
								maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
							},
							cacheableResponse: {
								statuses: [0, 200],
							},
						},
					},
					{
						urlPattern: /\/models\/.*\.(jpg|png|jpeg)$/i,
						handler: "CacheFirst",
						options: {
							cacheName: "model-textures-cache",
							expiration: {
								maxEntries: 30,
								maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
							},
							cacheableResponse: {
								statuses: [0, 200],
							},
						},
					},
				],
			},
		}),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	server: {
		host: "0.0.0.0",
		port: 5173,
	},
});
