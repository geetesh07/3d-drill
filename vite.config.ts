import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import topLevelAwait from "vite-plugin-top-level-await";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    port: 8081,
    host: "localhost",
  },
  plugins: [
    react(),
    topLevelAwait(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // The opencascade.js emscripten glue is huge and must not be pre-bundled by esbuild.
  optimizeDeps: {
    exclude: ["opencascade.js"],
    esbuildOptions: { target: "es2020" },
  },
  // Load all .wasm as URL assets (emscripten fetches them via locateFile / loadDynamicLibrary).
  assetsInclude: ["**/*.wasm"],
  build: {
    target: "es2020",
    sourcemap: mode === "development",
    minify: mode === "production" ? "terser" : false,
    terserOptions:
      mode === "production"
        ? { compress: { drop_console: true, drop_debugger: true } }
        : undefined,
  },
  publicDir: "public",
}));
