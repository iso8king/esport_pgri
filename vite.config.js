import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['.ngrok-free.app'], // biar semua subdomain ngrok diizinkan
    proxy: {
      '/api': {
        target: 'http://localhost:9999', // backend lokal kamu
        changeOrigin: true,
        secure: false
      }
    }
  }
})

