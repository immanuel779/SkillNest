import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['skillnest-icon.jpeg'],
      manifest: {
        name: 'SkillNest',
        short_name: 'SkillNest',
        description: 'Community skills exchange & volunteer platform.',
        theme_color: '#a020f0',
        background_color: '#0f0c29',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'skillnest-icon.jpeg', sizes: '192x192', type: 'image/jpeg' },
          { src: 'skillnest-icon.jpeg', sizes: '512x512', type: 'image/jpeg' }
        ]
      },
      workbox: {
        // ✅ KEY FIX: Allow files up to 5MB to be precached
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        globPatterns: ['**/*.{js,css,html,png,svg,ico}']
      }
    })
  ],
  build: {
    // ✅ Silence the chunk size warning (Vercel won't fail on this)
    chunkSizeWarningLimit: 3000
  }
})