import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    host: true,          // listen on all interfaces (0.0.0.0)
    allowedHosts: 'all', // allow any external host including ngrok
  },
})