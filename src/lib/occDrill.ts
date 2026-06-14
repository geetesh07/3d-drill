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

/**
 * Build one helical flute cutter: a circular profile swept along a helix that
 * lies on a cylinder of radius `rBody`, starting at angle `phi`.
 */
function makeFluteCutter(
  oc: OpenCascadeInstance,
  p: DrillParameters,
  rBody: number,
  zStart: number,
  zEnd: number,
  phi: number,
  rho: number
): unknown {
  const helixRad = (Math.max(0, p.helixAngle) * Math.PI) / 180;
  // Lead = axial advance per full turn. Helix angle 0 → straight flute (A = 0).
  const lead = helixRad > EPS ? (Math.PI * 2 * rBody) / Math.tan(helixRad) : Infinity;
  const B = zEnd - zStart; // axial span
  const A = isFinite(lead) ? (2 * Math.PI * B) / lead : 0; // total swept angle
  const M = Math.sqrt(A * A + B * B); // segment param length on the cylinder

  // Helix as a 2D line (u = angle, v = height) on a cylindrical surface.
  const cylAxis = new oc.gp_Ax3_4(new oc.gp_Pnt_3(0, 0, 0), new oc.gp_Dir_4(0, 0, 1));
  const cyl = new oc.Geom_CylindricalSurface_1(cylAxis, rBody);
  const line2d = new oc.Geom2d_Line_3(
    new oc.gp_Pnt2d_3(phi, zStart),
    new oc.gp_Dir2d_4(A, B)
  );
  const helixEdge = new oc.BRepBuilderAPI_MakeEdge_31(
    new oc.Handle_Geom2d_Curve_2(line2d),
    new oc.Handle_Geom_Surface_2(cyl),
    0,
    M
  ).Edge();
  oc.BRepLib.BuildCurves3d_2(helixEdge);
  const spine = new oc.BRepBuilderAPI_MakeWire_2(helixEdge).Wire();

  // Circular cutter profile, centered on the surface at the helix start, in the
  // plane normal to the helix tangent there.
  const p0 = new oc.gp_Pnt_3(rBody * Math.cos(phi), rBody * Math.sin(phi), zStart);
  const tangent = new oc.gp_Dir_4(-rBody * Math.sin(phi) * A, rBody * Math.cos(phi) * A, B);
  const circ = new oc.gp_Circ_2(new oc.gp_Ax2_3(p0, tangent), rho);
  const profEdge = new oc.BRepBuilderAPI_MakeEdge_8(circ).Edge();
  const profWire = new oc.BRepBuilderAPI_MakeWire_2(profEdge).Wire();
  const profFace = new oc.BRepBuilderAPI_MakeFace_15(profWire, true).Face();

  return new oc.BRepOffsetAPI_MakePipe_1(spine, profFace).Shape();
}

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
  const zBodyStart = z;
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

  // Cut helical flutes. Wrapped so a sweep/boolean failure degrades to the
  // (still valid) drill blank rather than breaking the whole model.
  const zApex = z;
  if (p.fluteCount >= 2) {
    try {
      const rho = 0.3 * p.diameter; // cutter radius ≈ flute depth
      // Run flutes from the shank/body junction up to the tip. Starting exactly
      // at the junction (small overlap) avoids a floating mid-body pocket; at the
      // tip the groove fades naturally as the cone narrows below the cutter.
      const zStart = zBodyStart - 0.5;
      const zEnd = zApex;
      if (zEnd - zStart > 1) {
        for (let i = 0; i < p.fluteCount; i++) {
          const phi = (2 * Math.PI * i) / p.fluteCount;
          const cutter = makeFluteCutter(oc, p, rBody, zStart, zEnd, phi, rho);
          shape = new oc.BRepAlgoAPI_Cut_3(shape, cutter).Shape();
        }
      }
    } catch (e) {
      console.warn("[drill] flute cut failed; returning drill blank:", e);
    }
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

/**
 * Extract the model's B-rep edges (outline, circles, AND the helical flute edges)
 * as line segments for a wireframe/edges view. Independent of the surface mesh.
 */
export function shapeToEdges(oc: OpenCascadeInstance, shape: unknown): THREE.BufferGeometry {
  const positions: number[] = [];
  let lineType: unknown = null;
  try {
    lineType = oc.GeomAbs_CurveType.GeomAbs_Line;
  } catch {
    lineType = null;
  }

  const seen = new Set<string>();
  const explorer = new oc.TopExp_Explorer_2(
    shape,
    oc.TopAbs_ShapeEnum.TopAbs_EDGE,
    oc.TopAbs_ShapeEnum.TopAbs_SHAPE
  );

  for (; explorer.More(); explorer.Next()) {
    try {
      const edge = oc.TopoDS.Edge_1(explorer.Current());
      const ad = new oc.BRepAdaptor_Curve_2(edge);
      const f = ad.FirstParameter();
      const l = ad.LastParameter();
      if (!isFinite(f) || !isFinite(l) || l - f <= 1e-9) continue;

      let n = 48;
      try {
        n = ad.GetType() === lineType ? 1 : 64;
      } catch {
        n = 48;
      }

      const pts: number[][] = [];
      for (let k = 0; k <= n; k++) {
        const t = f + ((l - f) * k) / n;
        const p = ad.Value(t);
        pts.push([p.X(), p.Y(), p.Z()]);
      }

      const a = pts[0];
      const b = pts[pts.length - 1];
      const key = [a, b].map((p) => p.map((v) => v.toFixed(2)).join(",")).sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);

      for (let k = 0; k + 1 < pts.length; k++) {
        positions.push(pts[k][0], pts[k][1], pts[k][2], pts[k + 1][0], pts[k + 1][1], pts[k + 1][2]);
      }
    } catch {
      /* skip degenerate edges */
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
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
