import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// Derive __dirname for ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Stub out the Figma-only virtual module so local dev doesn't break
    {
      name: 'figma-stubs',
      resolveId(id) {
        if (id === 'figma:foundry-client-api') return id;
        if (id.startsWith('figma:asset/')) return '\0figma-asset';
      },
      load(id) {
        if (id === 'figma:foundry-client-api') return 'export default {}';
        if (id === '\0figma-asset') return 'export default ""';
      },
    },
  ],
  server: { 
    allowedHosts: ['.render.com'] // Added dot prefix so all subdomains on Render work
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
})