import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    port: 8081,
    host: 'localhost',
    origin: 'http://localhost:8081',
    fs: {
      strict: true,
      allow: [path.resolve(__dirname)],
    },
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    },
  },
  plugins: [
    react(),
    wasm(),
    topLevelAwait(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      'opencascade.js': path.resolve(__dirname, 'node_modules/opencascade.js/dist/opencascade.js'),
    },
  },
  optimizeDeps: {
    exclude: ['opencascade.js'],
    esbuildOptions: {
      target: 'es2020',
    },
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      external: ['opencascade.js'],
    },
    sourcemap: mode === 'development',
    minify: mode === 'production' ? 'terser' : false,
    terserOptions: mode === 'production' ? {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    } : undefined,
  },
  publicDir: 'public',
  assetsInclude: ['**/*.wasm'],
}));
