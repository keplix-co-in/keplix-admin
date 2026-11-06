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
  // Security review 2026-10-28 O-003 / O-004: strip debug logging from
  // production bundles so admin emails, request URLs or user objects can't
  // leak into the browser console even if a stray console.log is reintroduced.
  // Vite 8 bundles/minifies with Rolldown + Oxc (esbuild's `drop` option is
  // not honoured), so this is done in two Rolldown settings:
  //  - treeshake.manualPureFunctions marks console.log/info/debug/warn/trace/
  //    dir/table as side-effect free, so the calls are removed from the bundle;
  //  - the Oxc minifier's dropDebugger removes `debugger;` statements.
  // console.error is deliberately KEPT for production diagnostics; call sites
  // must log messages/status codes, never tokens or user objects.
  // Only affects `vite build`; dev server and vitest are unchanged.
  build: {
    rolldownOptions: {
      treeshake: {
        manualPureFunctions: [
          'console.log',
          'console.info',
          'console.debug',
          'console.warn',
          'console.trace',
          'console.dir',
          'console.table',
        ],
      },
      output: {
        minify: {
          compress: { dropDebugger: true },
          mangle: true,
        },
      },
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
