/**
 * Parametric drill-bit geometry built with OpenCASCADE B-rep solids.
 *
 * The body is assembled from primitives along +Z and fused into one watertight
 * solid (no fragile mesh booleans):
 *   shank cylinder → (chamfer cone) → fluted-body cylinder → tip cone
 *
 * Helical flutes are cut in a later step. The fused solid is exact, so STEP
 * export and HLR-based 2D projection are both faithful to the model.
 */
import * as THREE from "three";
import { getOC, type OpenCascadeInstance } from "./occ";
import type { DrillParameters } from "@/types/drill";

const EPS = 1e-6;

export interface DrillSolid {
  oc: OpenCascadeInstance;
  shape: unknown; // TopoDS_Shape
  metrics: {
    tipHeight: number;
    chamferHeight: number;
    bodyLength: number;
    totalLength: number;
  };
}

/** Build the fused drill solid from parameters. */
export async function buildDrillSolid(p: DrillParameters): Promise<DrillSolid> {
  const oc = await getOC();

  const rBody = Math.max(p.diameter, 0.1) / 2;
  const rShank = Math.max(p.shankDiameter, 0.1) / 2;
  const tipHeight = p.tipAngle >= 180 ? 0 : rBody / Math.tan((p.tipAngle * Math.PI) / 360);
  const chamferHeight = Math.abs(rBody - rShank);
  const bodyLength = Math.max(0.1, p.length - p.shankLength - chamferHeight - tipHeight);

  const zDir = new oc.gp_Dir_4(0, 0, 1);
  const axisAt = (z: number) => new oc.gp_Ax2_3(new oc.gp_Pnt_3(0, 0, z), zDir);

  const parts: unknown[] = [];
  let z = 0;

  // Shank
  parts.push(new oc.BRepPrimAPI_MakeCylinder_3(axisAt(z), rShank, p.shankLength).Shape());
  z += p.shankLength;

  // Chamfer/transition cone (only when shank and body diameters differ)
  if (chamferHeight > EPS) {
    parts.push(new oc.BRepPrimAPI_MakeCone_3(axisAt(z), rShank, rBody, chamferHeight).Shape());
    z += chamferHeight;
  }

  // Fluted body
  parts.push(new oc.BRepPrimAPI_MakeCylinder_3(axisAt(z), rBody, bodyLength).Shape());
  z += bodyLength;

  // Conical tip
  if (tipHeight > EPS) {
    parts.push(new oc.BRepPrimAPI_MakeCone_3(axisAt(z), rBody, 0, tipHeight).Shape());
    z += tipHeight;
  }

  // Fuse sequentially into one solid
  let shape = parts[0];
  for (let i = 1; i < parts.length; i++) {
    shape = new oc.BRepAlgoAPI_Fuse_3(shape, parts[i]).Shape();
  }

  return {
    oc,
    shape,
    metrics: { tipHeight, chamferHeight, bodyLength, totalLength: z },
  };
}

/** Tessellate an OCC shape into a Three.js BufferGeometry for the viewer. */
export function shapeToBufferGeometry(
  oc: OpenCascadeInstance,
  shape: unknown,
  linDeflection = 0.1,
  angDeflection = 0.3
): THREE.BufferGeometry {
  // Tessellate (mutates the shape, storing triangulation on each face)
  new oc.BRepMesh_IncrementalMesh_2(shape, linDeflection, false, angDeflection, false);

  const positions: number[] = [];
  const indices: number[] = [];
  let vertexOffset = 0;

  const reversedEnum = oc.TopAbs_Orientation.TopAbs_REVERSED;
  const explorer = new oc.TopExp_Explorer_2(
    shape,
    oc.TopAbs_ShapeEnum.TopAbs_FACE,
    oc.TopAbs_ShapeEnum.TopAbs_SHAPE
  );

  for (; explorer.More(); explorer.Next()) {
    const face = oc.TopoDS.Face_1(explorer.Current());
    const loc = new oc.TopLoc_Location_1();
    const triHandle = oc.BRep_Tool.Triangulation(face, loc);
    if (triHandle.IsNull && triHandle.IsNull()) continue;

    const tri = triHandle.get ? triHandle.get() : triHandle;
    const trsf = loc.Transformation();

    const orient = face.Orientation_1();
    const reversed = orient === reversedEnum || (orient && orient.value === reversedEnum.value);

    const nbNodes = tri.NbNodes();
    for (let i = 1; i <= nbNodes; i++) {
      const pnt = tri.Node(i).Transformed(trsf);
      positions.push(pnt.X(), pnt.Y(), pnt.Z());
    }

    const nbTri = tri.NbTriangles();
    for (let i = 1; i <= nbTri; i++) {
      const t = tri.Triangle(i);
      let a = t.Value(1);
      const b = t.Value(2);
      let c = t.Value(3);
      if (reversed) {
        const tmp = a;
        a = c;
        c = tmp;
      }
      indices.push(vertexOffset + a - 1, vertexOffset + b - 1, vertexOffset + c - 1);
    }
    vertexOffset += nbNodes;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

/** Write the shape to a real STEP (ISO-10303) string. */
export function shapeToStep(oc: OpenCascadeInstance, shape: unknown): string {
  const writer = new oc.STEPControl_Writer_1();
  writer.Transfer(
    shape,
    oc.STEPControl_StepModelType.STEPControl_AsIs,
    true,
    new oc.Message_ProgressRange_1()
  );
  const fname = "/drill_export.step";
  writer.Write(fname);
  return oc.FS.readFile(fname, { encoding: "utf8" });
}

const DEFAULT_PARAMS: DrillParameters = {
  diameter: 10,
  length: 100,
  shankDiameter: 10,
  shankLength: 30,
  fluteCount: 2,
  fluteLength: 60,
  nonCuttingLength: 10,
  tipAngle: 118,
  helixAngle: 30,
  material: "hss",
  surfaceFinish: "polished",
};

/** Dev smoke test: build the default drill, mesh it, and export STEP. */
export async function occDrillTest(params: DrillParameters = DEFAULT_PARAMS) {
  try {
    console.log("[drill] building solid…");
    const { oc, shape, metrics } = await buildDrillSolid(params);
    console.log("[drill] metrics", metrics);

    console.log("[drill] meshing…");
    const geom = shapeToBufferGeometry(oc, shape);
    const triCount = geom.index ? geom.index.count / 3 : 0;
    const vtxCount = geom.getAttribute("position").count;

    console.log("[drill] STEP export…");
    const step = shapeToStep(oc, shape);

    const result = { ok: true, vertices: vtxCount, triangles: triCount, stepBytes: step.length };
    console.log("[drill] ✅", result);
    return result;
  } catch (e) {
    const msg = (e && (e as { message?: string }).message) || String(e);
    console.error("[drill] ❌", msg, e);
    return { ok: false, error: msg };
  }
}

if (import.meta.env.DEV && typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).__occDrillTest = occDrillTest;
}
