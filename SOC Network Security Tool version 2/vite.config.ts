import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    // Stub out the Figma-only virtual modules so local dev doesn't break
    {
      name: 'figma-stubs',

      resolveId(id) {
        if (id === 'figma:foundry-client-api') return id
        if (id.startsWith('figma:asset/')) return '\0figma-asset'
      },

      load(id) {
        if (id === 'figma:foundry-client-api') {
          return 'export default {}'
        }

        if (id === '\0figma-asset') {
          return 'export default ""'
        }
      },
    },
  ],

  preview: {
    allowedHosts: ['soc-network-security-tool.onrender.com'],
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  assetsInclude: ['**/*.svg', '**/*.csv'],
})
