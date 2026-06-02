import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import webExtension from 'vite-plugin-web-extension'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    webExtension({
      manifest: 'manifest.json',
      additionalInputs: ['src/content/index.ts', 'src/background/index.ts'],
      webExtConfig: {
        target: 'chrome-mv3',
        startUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'framer-motion', 'zustand'],
  },
  build: {
    target: 'esnext',
    sourcemap: false,
    rollupOptions: {
      // Ensure React is not treated as external in any build
      external: [],
    },
  },
})
