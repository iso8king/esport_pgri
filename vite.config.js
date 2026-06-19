import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path'


export default defineConfig({
  plugins: [svelte()],
  resolve : {
    alias : {
      $lib: path.resolve(__dirname, './src/lib')
    }
  },
  build : {
    assetsDir: 'static'
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['.ngrok-free.app'],
    proxy: {
      '/api': {
        target: 'http://localhost:9999',
        changeOrigin: true,
        secure: false
      },
      '/assets' : {
        target : 'http://localhost:9999',
        changeOrigin: true,
        secure: false
      }
    }
  }
})

