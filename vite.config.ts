import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [
    react(),
    tailwindcs  ],

  // For development (vite)
  server: {
    host: true,
    allowedHosts: true,
  },

  // For preview / production build serving (vite preview)
  preview: {
    host: true,
    allowedHosts: true,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  assetsInclude: ['**/*.svg', '**/*.csv'],
})