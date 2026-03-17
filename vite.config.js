import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    host: true,
    allowedHosts: 'all',
  },
  define: {
    global: 'globalThis',   // fix sockjs-client "global is not defined" in Vite
  },
})