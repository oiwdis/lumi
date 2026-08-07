import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Lumi — Language Learning',
        short_name: 'Lumi',
        description: 'Learn a language with Lumi',
        theme_color: '#6c63ff',
        background_color: '#0a0a0f',
        display: 'standalone',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Drop precaches from previous deploys instead of letting them accumulate
        // and serve a stale mix of old and new assets.
        cleanupOutdatedCaches: true,
        // The SPA fallback must never answer an API request with index.html
        navigateFallbackDenylist: [/^\/api\//],
        // No runtime caching of /api. It used to hold GET /api/progress for 24
        // hours, which on a shared device could serve one account's progress to
        // whoever signed in next. Offline progress already comes from the
        // persisted store in localStorage, so nothing is lost by dropping it.
      },
    }),
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
