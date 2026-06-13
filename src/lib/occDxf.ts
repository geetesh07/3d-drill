/**
 * 2D engineering drawing (DXF) generated FROM the 3D model.
 *
 * Every edge of the OCC solid is discretized and projected into two orthographic
 * views — a side view (drill axis horizontal: shows the outline + flute profile)
 * and an end view (the cross-section with flute notches). Written with dxf-writer.
 *
 * This is a true wireframe projection of the model edges (no hidden-line removal
 * yet); HLR-based clean views are a future upgrade.
 */
import Drawing from "dxf-writer";
import type { OpenCascadeInstance } from "./occ";
import type { DrillParameters } from "@/types/drill";

interface Pt {
  x: number;
  y: number;
  z: number;
}

/** Discretize every edge of the shape into 3D polylines. */
function edgePolylines(oc: OpenCascadeInstance, shape: unknown): Pt[][] {
  const polys: Pt[][] = [];
  const seen = new Set<string>();
  const explorer = new oc.TopExp_Explorer_2(
    shape,
    oc.TopAbs_ShapeEnum.TopAbs_EDGE,
    oc.TopAbs_ShapeEnum.TopAbs_SHAPE
  );

  let lineType: unknown;
  try {
    lineType = oc.GeomAbs_CurveType.GeomAbs_Line;
  } catch {
    lineType = null;
  }

  for (; explorer.More(); explorer.Next()) {
    try {
      const edge = oc.TopoDS.Edge_1(explorer.Current());
      const adaptor = new oc.BRepAdaptor_Curve_2(edge);
      const f = adaptor.FirstParameter();
      const l = adaptor.LastParameter();
      if (!isFinite(f) || !isFinite(l) || l - f <= 1e-9) continue;

      let n = 32;
      try {
        n = adaptor.GetType() === lineType ? 1 : 48;
      } catch {
        n = 32;
      }

      const pts: Pt[] = [];
      for (let k = 0; k <= n; k++) {
        const t = f + ((l - f) * k) / n;
        const gp = adaptor.Value(t);
        pts.push({ x: gp.X(), y: gp.Y(), z: gp.Z() });
      }

      // De-duplicate edges shared by two faces (same endpoints, either direction).
      const a = pts[0];
      const b = pts[pts.length - 1];
      const key = [a, b]
        .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)},${p.z.toFixed(2)}`)
        .sort()
        .join("|");
      if (seen.has(key)) continue;
      seen.add(key);

      polys.push(pts);
    } catch {
      // skip degenerate/unsupported edges
    }
  }
  return polys;
}

/** Build a real DXF string with side + end views projected from the model. */
export function exportDrillDxf(oc: OpenCascadeInstance, shape: unknown, p: DrillParameters): string {
  const polys = edgePolylines(oc, shape);

  // 3D bounds (drill axis is Z; X/Y are radial)
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  for (const pl of polys) {
    for (const pt of pl) {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
      if (pt.z < minZ) minZ = pt.z;
      if (pt.z > maxZ) maxZ = pt.z;
    }
  }

  const d = new Drawing();
  d.addLayer("Outline", 7, "CONTINUOUS");
  d.addLayer("Centerline", 1, "CENTER");
  d.addLayer("Text", 3, "CONTINUOUS");

  // ---- Side view: horizontal = Z (length), vertical = X (radius) ----
  d.setActiveLayer("Outline");
  const sideX = (z: number) => z - minZ;
  const sideY = (x: number) => x;
  for (const pl of polys) {
    for (let i = 0; i + 1 < pl.length; i++) {
      d.drawLine(sideX(pl[i].z), sideY(pl[i].x), sideX(pl[i + 1].z), sideY(pl[i + 1].x));
    }
  }
  // Axis centerline
  d.setActiveLayer("Centerline");
  d.drawLine(sideX(minZ) - 5, 0, sideX(maxZ) + 5, 0);

  // ---- End view: horizontal = X, vertical = Y, placed below the side view ----
  const radial = Math.max(maxX - minX, maxY - minY);
  const endCx = sideX(maxZ) + radial * 0.9 + 15; // to the right of the side view
  const endCy = 0;
  d.setActiveLayer("Outline");
  for (const pl of polys) {
    for (let i = 0; i + 1 < pl.length; i++) {
      d.drawLine(endCx + pl[i].x, endCy + pl[i].y, endCx + pl[i + 1].x, endCy + pl[i + 1].y);
    }
  }
  d.setActiveLayer("Centerline");
  d.drawLine(endCx - radial * 0.7, endCy, endCx + radial * 0.7, endCy);
  d.drawLine(endCx, endCy - radial * 0.7, endCx, endCy + radial * 0.7);

  // ---- Labels ----
  d.setActiveLayer("Text");
  const labelY = maxX + 6;
  d.drawText(sideX(minZ), labelY, 4, 0, "SIDE VIEW");
  d.drawText(endCx - radial * 0.7, labelY, 4, 0, "END VIEW");
  d.drawText(
    sideX(minZ),
    minX - 8,
    3,
    0,
    `Drill  Ø${p.diameter}  L${p.length}  ${p.fluteCount}-flute  ${p.helixAngle}° helix  ${p.tipAngle}° tip`
  );

  return d.toDxfString();
}

if (import.meta.env.DEV && typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).__dxfTest = async () => {
    const { buildDrillSolid } = await import("./occDrill");
    const params: DrillParameters = {
      diameter: 10, length: 100, shankDiameter: 10, shankLength: 30,
      fluteCount: 2, fluteLength: 60, nonCuttingLength: 10,
      tipAngle: 118, helixAngle: 30, material: "hss", surfaceFinish: "polished",
    };
    try {
      const { oc, shape } = await buildDrillSolid(params);
      const dxf = exportDrillDxf(oc, shape, params);
      const lines = (dxf.match(/\nLINE\n/g) || []).length;
      console.log(`[dxf] ✅ bytes=${dxf.length}, LINE entities=${lines}`);
      (window as unknown as Record<string, unknown>).__dxf = dxf;
      return { ok: true, bytes: dxf.length, lines };
    } catch (e) {
      console.error("[dxf] ❌", e);
      return { ok: false, error: String((e as { message?: string })?.message || e) };
    }
  };
}
