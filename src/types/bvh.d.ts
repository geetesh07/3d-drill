import * as THREE from 'three';
import { MeshBVH } from 'three-mesh-bvh';
import { EdgeProjection } from 'three-edge-projection';

declare module 'three' {
  interface BufferGeometry {
    computeBoundsTree: () => void;
    disposeBoundsTree: () => void;
    boundsTree?: MeshBVH;
  }

  interface Mesh {
    raycast: (raycaster: THREE.Raycaster, intersects: THREE.Intersection[]) => void;
  }
}

export interface BVHMesh extends THREE.Mesh {
  geometry: THREE.BufferGeometry & {
    computeBoundsTree: () => void;
    disposeBoundsTree: () => void;
    boundsTree?: MeshBVH;
  };
  raycast: (raycaster: THREE.Raycaster, intersects: THREE.Intersection[]) => void;
} 