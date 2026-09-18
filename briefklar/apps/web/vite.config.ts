import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: false,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    target: "es2022",
  },
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["icon.svg", "icon-192.png", "icon-512.png", "robots.txt"],
      manifest: {
        id: "/",
        name: "Briefklar",
        short_name: "Briefklar",
        description: "Brief fotografieren. Verstehen, was drinsteht.",
        lang: "de",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#f6f7fb",
        theme_color: "#1d4ed8",
        categories: ["productivity", "utilities"],
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
        ],
      },
      workbox: {
        // App shell only. The API is never cached.
        globPatterns: ["**/*.{js,css,html,svg,png,webmanifest,txt}"],
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api(\/|$)/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
            handler: "NetworkOnly",
          },
        ],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
