/**
 * Clean 2D edge projection via three-edge-projection (gkjohnson).
 *
 * Takes a tessellated drill mesh and produces hidden-line-removed edge sets:
 * visible edges (solid) + hidden edges (dashed) — i.e. a real engineering view.
 */
import * as THREE from "three";
import { MeshBVH } from "three-mesh-bvh";
// Deep import to avoid pulling SilhouetteGenerator (clipper2-js) / webgpu from the barrel.
import { ProjectionGenerator } from "three-edge-projection/src/ProjectionGenerator.js";

export interface ProjectedView {
  visible: THREE.BufferGeometry;
  hidden: THREE.BufferGeometry;
}

/**
 * Project a mesh's edges. The generator looks down -Y onto the XZ plane, so
 * `rotation` (applied before projection) selects the view direction.
 */
export async function projectEdges(
  geometry: THREE.BufferGeometry,
  rotation?: THREE.Euler,
  angleThreshold = 30
): Promise<ProjectedView> {
  const geo = geometry.clone();
  if (rotation) geo.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(rotation));
  // three-edge-projection reads geometry.boundsTree
  (geo as unknown as { boundsTree: MeshBVH }).boundsTree = new MeshBVH(geo);

  const mesh = new THREE.Mesh(geo);
  const generator = new ProjectionGenerator();
  generator.angleThreshold = angleThreshold;
  generator.includeIntersectionEdges = true;

  const result = await generator.generateAsync(mesh, { signal: new AbortController().signal });
  return {
    visible: result.visibleEdges.getLineGeometry(),
    hidden: result.hiddenEdges.getLineGeometry(),
  };
}

// Dev spike: confirm the projection pipeline runs and produces edges.
if (import.meta.env.DEV && typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).__projTest = async () => {
    try {
      const { buildDrillSolid, shapeToBufferGeometry } = await import("./occDrill");
      const params = {
        diameter: 10, length: 100, shankDiameter: 10, shankLength: 30,
        fluteCount: 2, fluteLength: 60, nonCuttingLength: 10,
        tipAngle: 118, helixAngle: 30, material: "hss" as const, surfaceFinish: "polished" as const,
      };
      const { oc, shape } = await buildDrillSolid(params);
      const geom = shapeToBufferGeometry(oc, shape);
      // Side view: drill axis is Z; rotate so the length lies in the XZ plane under the -Y camera.
      const t0 = performance.now();
      const view = await projectEdges(geom, new THREE.Euler(Math.PI / 2, 0, 0));
      const v = view.visible.getAttribute("position")?.count ?? 0;
      const h = view.hidden.getAttribute("position")?.count ?? 0;
      const ms = Math.round(performance.now() - t0);
      console.log(`[proj] ✅ visible=${v} verts, hidden=${h} verts, ${ms}ms`);
      return { ok: true, visible: v, hidden: h, ms };
    } catch (e) {
      console.error("[proj] ❌", e);
      return { ok: false, error: String((e as { message?: string })?.message || e) };
    }
  };
}
