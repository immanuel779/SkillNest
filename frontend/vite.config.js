import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

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
      }
    })
  ]
});