import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Use relative base for mobile (Capacitor) to fix file:// asset loading
  // Use /trackapp/ for web production to support subpath hosting
  base: mode === 'mobile' ? './' : '/trackapp/',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
}))
