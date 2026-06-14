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

declare module "three-edge-projection/src/ProjectionGenerator.js" {
  import type { BufferGeometry, Object3D } from "three";
  interface EdgeSet {
    getLineGeometry(meshes?: unknown): BufferGeometry;
  }
  interface ProjectionResult {
    visibleEdges: EdgeSet;
    hiddenEdges: EdgeSet;
  }
  export class ProjectionGenerator {
    iterationTime: number;
    angleThreshold: number;
    includeIntersectionEdges: boolean;
    generateAsync(
      geometry: BufferGeometry | Object3D | Array<Object3D>,
      options?: { onProgress?: (p: number, msg: string) => void; signal?: AbortSignal }
    ): Promise<ProjectionResult>;
  }
}
