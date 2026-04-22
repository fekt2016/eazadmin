import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const devApiTarget = env.VITE_DEV_PROXY_TARGET || 'http://localhost:4000'

  return {
  plugins: [react()],
  server: {
    proxy: {
      '/socket.io': { target: devApiTarget, ws: true, changeOrigin: true },
      '/api': { target: devApiTarget, changeOrigin: true },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React — always needed
          'vendor-react': [
            'react',
            'react-dom',
            'react-router-dom',
          ],
          // Data fetching
          'vendor-query': [
            '@tanstack/react-query',
            'axios',
          ],
          // Styling
          'vendor-styled': [
            'styled-components',
          ],
          // Animation — heavy, rarely needed at load
          'vendor-motion': [
            'framer-motion',
          ],
          // Icons — large, loaded everywhere but 
          // separating allows better caching
          'vendor-icons': [
            'react-icons',
          ],
        },
      },
    },
  },
  }
})
