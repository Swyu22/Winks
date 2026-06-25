import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // 确保在 GitHub Pages 或子路径下资源能正确加载
  build: {
    rollupOptions: {
      output: {
        // Split React into a stable vendor chunk so app-code deploys don't bust its cache.
        manualChunks: {
          react: ['react', 'react-dom'],
        },
      },
    },
  },
})
