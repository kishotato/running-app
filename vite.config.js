import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// base: './' makes every asset path relative, so the app works on GitHub Pages
// whatever the repository is called (https://<user>.github.io/<repo>/).
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      // Update the cached app automatically when a new version is deployed.
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Lakeland Training',
        short_name: 'Training',
        description: 'Personal running training plan and log',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0b0e13',
        theme_color: '#0b0e13',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Cache everything the build produces so the app opens with no signal.
        globPatterns: ['**/*.{js,css,html,svg,png,json}'],
      },
    }),
  ],
})
