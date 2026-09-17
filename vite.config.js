import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  // "@/..." alias required by shadcn/ui's generated components (they import
  // "@/lib/utils", "@/components/ui/...") -- without this those imports
  // resolve to nothing at build time.
  resolve: {
    alias: {
      // No __dirname here -- this file is loaded as ESM.
      '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    css: false,
    env: {
      VITE_API_URL: 'http://test.local/api',
    },
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
})
