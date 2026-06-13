// Ambient module declarations for the OpenCASCADE.js emscripten build + wasm URL assets.

declare module "opencascade.js/dist/opencascade.js" {
  // The emscripten MODULARIZE factory. Resolves to an OpenCascade instance.
  const factory: (settings?: Record<string, unknown>) => Promise<any>;
  export default factory;
}

declare module "*.wasm?url" {
  const url: string;
  export default url;
}
