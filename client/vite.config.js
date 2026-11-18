import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import Sitemap from 'vite-plugin-sitemap'

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    Sitemap({
      hostname: 'https://skillnest.name.ng',
      // If you have multiple pages (like /about, /contact), add them here!
      // If you don't add them, the sitemap will only include the homepage.
      dynamicRoutes: [
        '/',
        // '/about',
        // '/courses',
        // '/login',
      ]
    })
  ],
})