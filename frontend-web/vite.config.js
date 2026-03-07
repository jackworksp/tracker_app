import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@design-system': path.resolve(__dirname, '../design-system'),
    },
  },
  // Use relative base for mobile (Capacitor) to fix file:// asset loading
  // Use /vela/ for web production to support subpath hosting
  base: mode === 'mobile' ? './' : '/vela/',
  server: {
    proxy: {
      '/vela/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: true,
  }
}))
