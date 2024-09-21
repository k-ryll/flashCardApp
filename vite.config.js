import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({

  plugins: [react()],
  define: {
    'process.env': process.env,
  },
  build: {
    cssCodeSplit: true, // Split CSS into separate files for better caching
    minify: 'esbuild', // Ensure minification happens
  }
})
