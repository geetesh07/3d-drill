/**
 * 2D engineering drawing (DXF) generated FROM the 3D model.
 * Side view: three-edge-projection HLR on the tessellated mesh.
 * End view: exact OCC B-rep edges projected to XY, filtered to tip + outer circle.
 */
import Drawing from "dxf-writer";
import * as THREE from "three";
import { shapeToBufferGeometry } from "./occDrill";
import { projectEdges, type ProjectedView } from "./occProjection";
import type { OpenCascadeInstance } from "./occ";
import type { DrillParameters } from "@/types/drill";

type Seg = [number, number, number, number]; // x1,y1,x2,y2

/** Pull 2D segments (x,z plane) out of a projected LineSegments geometry. */
function toSegments(geo: THREE.BufferGeometry): Seg[] {
  const pos = geo.getAttribute("position");
  const segs: Seg[] = [];
  if (!pos) return segs;
  for (let i = 0; i + 1 < pos.count; i += 2) {
    segs.push([pos.getX(i), pos.getZ(i), pos.getX(i + 1), pos.getZ(i + 1)]);
  }
  return segs;
}

interface View {
  vis: Seg[];
  hid: Seg[];
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

function boundsOf(segs: Seg[]): Pick<View, "minX" | "maxX" | "minY" | "maxY"> {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const s of segs) {
    minX = Math.min(minX, s[0], s[2]);
    maxX = Math.max(maxX, s[0], s[2]);
    minY = Math.min(minY, s[1], s[3]);
    maxY = Math.max(maxY, s[1], s[3]);
  }
  if (!isFinite(minX)) { minX = maxX = minY = maxY = 0; }
  return { minX, maxX, minY, maxY };
}

function makeView(p: ProjectedView): View {
  const vis = toSegments(p.visible);
  const hid = toSegments(p.hidden);
  return { vis, hid, ...boundsOf([...vis, ...hid]) };
}

/**
 * End view from exact OCC B-rep edges projected to XY (looking down -Z from tip).
 * Only includes:
 *   • edges whose midpoint Z is in the tip region (top 20% of total length)
 *   • circular edges at radius ≈ rBody (the body diameter silhouette)
 * This gives: outer circle + cutting lips + chisel edge — no tessellation artifacts.
 */
function buildEndView(oc: OpenCascadeInstance, shape: unknown, p: DrillParameters): View {
  const rBody = p.diameter / 2;
  const totalLength = p.length;
  const tipZStart = totalLength * 0.80; // show edges in top 20% (tip region)
  const rTol = rBody * 0.05; // 5% tolerance for "at outer diameter"

  const segs: Seg[] = [];
  let lineType: unknown = null;
  try { lineType = oc.GeomAbs_CurveType.GeomAbs_Line; } catch { /* ignore */ }

  const explorer = new (oc as unknown as { TopExp_Explorer_2: new (...a: unknown[]) => unknown }).TopExp_Explorer_2(
    shape,
    (oc as unknown as { TopAbs_ShapeEnum: { TopAbs_EDGE: unknown } }).TopAbs_ShapeEnum.TopAbs_EDGE,
    (oc as unknown as { TopAbs_ShapeEnum: { TopAbs_SHAPE: unknown } }).TopAbs_ShapeEnum.TopAbs_SHAPE
  );

  const seen = new Set<string>();
  for (; (explorer as unknown as { More: () => boolean }).More(); (explorer as unknown as { Next: () => void }).Next()) {
    try {
      const edge = (oc as unknown as { TopoDS: { Edge_1: (s: unknown) => unknown } }).TopoDS.Edge_1(
        (explorer as unknown as { Current: () => unknown }).Current()
      );
      const ad = new (oc as unknown as { BRepAdaptor_Curve_2: new (e: unknown) => unknown }).BRepAdaptor_Curve_2(edge);
      const f = (ad as unknown as { FirstParameter: () => number }).FirstParameter();
      const l = (ad as unknown as { LastParameter: () => number }).LastParameter();
      if (!isFinite(f) || !isFinite(l) || l - f <= 1e-9) continue;

      let n = 48;
      try { n = (ad as unknown as { GetType: () => unknown }).GetType() === lineType ? 1 : 64; } catch { /* ignore */ }

      const pts3d: [number, number, number][] = [];
      for (let k = 0; k <= n; k++) {
        const t = f + ((l - f) * k) / n;
        const pnt = (ad as unknown as { Value: (t: number) => { X: () => number; Y: () => number; Z: () => number } }).Value(t);
        pts3d.push([pnt.X(), pnt.Y(), pnt.Z()]);
      }

      // De-duplicate
      const a = pts3d[0], b = pts3d[pts3d.length - 1];
      const key = [a, b].map(pt => pt.map(v => v.toFixed(2)).join(",")).sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);

      const midZ = pts3d.reduce((s, pt) => s + pt[2], 0) / pts3d.length;
      const midR = pts3d.reduce((s, pt) => s + Math.hypot(pt[0], pt[1]), 0) / pts3d.length;
      const isOuterCircle = Math.abs(midR - rBody) < rTol;
      const isTipRegion = midZ > tipZStart;

      if (!isOuterCircle && !isTipRegion) continue;

      // Project to XY (looking down -Z from the tip)
      for (let k = 0; k + 1 < pts3d.length; k++) {
        const [x1, y1] = pts3d[k];
        const [x2, y2] = pts3d[k + 1];
        const dx = x2 - x1, dy = y2 - y1;
        if (dx * dx + dy * dy < 0.01) continue;
        segs.push([x1, y1, x2, y2]);
      }
    } catch { /* skip degenerate */ }
  }

  return { vis: segs, hid: [], ...boundsOf(segs) };
}

const MIN_SEG = 0.1; // mm — drop anything shorter (eliminates dot artifacts)
const draw = (d: Drawing, segs: Seg[], ox: number, oy: number) => {
  for (const s of segs) {
    const dx = s[2] - s[0], dy = s[3] - s[1];
    if (dx * dx + dy * dy < MIN_SEG * MIN_SEG) continue;
    d.drawLine(ox + s[0], oy + s[1], ox + s[2], oy + s[3]);
  }
};

/** Build a real DXF (side + end views) from the model. */
export async function exportDrillDxf(
  oc: OpenCascadeInstance,
  shape: unknown,
  p: DrillParameters,
  onProgress?: (msg: string) => void
): Promise<string> {
  const mesh = shapeToBufferGeometry(oc, shape, 0.04, 0.1);

  onProgress?.("Projecting side view…");
  const side = makeView(await projectEdges(mesh, new THREE.Euler(0, Math.PI / 2, 0), 30));
  onProgress?.("Building end view…");
  // End view uses exact OCC B-rep edges (not mesh projection) — reliable tip geometry
  const end = buildEndView(oc, shape, p);

  const d = new Drawing();
  d.addLineType("CENTER", "Center ____ _ ____ _", [12.7, -2.54, 2.54, -2.54]);
  d.addLayer("Visible", 7, "CONTINUOUS");
  d.addLayer("Center", 1, "CENTER");
  d.addLayer("Text", 3, "CONTINUOUS");

  // Layout: side view at origin; end view to its right.
  const sideOx = -side.minX;
  const sideOy = -(side.minY + side.maxY) / 2; // center vertically on the axis
  const gap = Math.max(20, (end.maxX - end.minX) * 0.4);
  const endOx = sideOx + side.maxX + gap - end.minX;
  const endOy = -(end.minY + end.maxY) / 2;

  // Visible edges only — hidden lines omitted per user preference
  d.setActiveLayer("Visible");
  draw(d, side.vis, sideOx, sideOy);
  draw(d, end.vis, endOx, endOy);

  // Centerlines
  d.setActiveLayer("Center");
  d.drawLine(sideOx + side.minX - 6, 0, sideOx + side.maxX + 6, 0);
  const endR = Math.max(end.maxX - end.minX, end.maxY - end.minY) / 2 + 6;
  const endCx = endOx + (end.minX + end.maxX) / 2;
  d.drawLine(endCx - endR, 0, endCx + endR, 0);
  d.drawLine(endCx, -endR, endCx, endR);

  // Labels
  d.setActiveLayer("Text");
  const labelY = Math.min(sideOy + side.minY, endOy + end.minY) - 8;
  d.drawText(sideOx + side.minX, labelY, 4, 0, "SIDE VIEW");
  d.drawText(endOx + end.minX, labelY, 4, 0, "END VIEW");
  d.drawText(
    sideOx + side.minX,
    labelY - 7,
    3,
    0,
    `Drill  ${p.diameter}mm x ${p.length}mm  ${p.fluteCount}-flute  ${p.helixAngle}deg helix  ${p.tipAngle}deg point`
  );

  // dxf-writer doesn't emit $ACADVER; without it AutoCAD opens the file read-only.
  // Inject it at the top of the HEADER section (R12 / AC1009 = widest compatibility).
  const raw = d.toDxfString();
  const headerMarker = "  0\nSECTION\n  2\nHEADER\n";
  const acadVer = "  9\n$ACADVER\n  1\nAC1009\n";
  return raw.includes(headerMarker)
    ? raw.replace(headerMarker, headerMarker + acadVer)
    : raw;
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
      const t0 = performance.now();
      const dxf = await exportDrillDxf(oc, shape, params, (m) => console.log("[dxf]", m));
      const lines = (dxf.match(/\nLINE\n/g) || []).length;
      console.log(`[dxf] ✅ bytes=${dxf.length}, LINE=${lines}, ${Math.round(performance.now() - t0)}ms`);
      (window as unknown as Record<string, unknown>).__dxf = dxf;
      return { ok: true, bytes: dxf.length, lines };
    } catch (e) {
      console.error("[dxf] ❌", e);
      return { ok: false, error: String((e as { message?: string })?.message || e) };
    }
  };
}
