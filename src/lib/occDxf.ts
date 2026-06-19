/**
 * 2D engineering drawing (DXF) generated FROM the 3D model.
 * Side view: three-edge-projection HLR on the tessellated mesh.
 * End view: exact B-rep edges from shapeToEdges, projected to XY,
 *            filtered to tip region + outer diameter circle.
 */
import Drawing from "dxf-writer";
import * as THREE from "three";
import { shapeToBufferGeometry, shapeToEdges } from "./occDrill";
import { projectEdges, type ProjectedView } from "./occProjection";
import type { OpenCascadeInstance } from "./occ";
import type { DrillParameters } from "@/types/drill";

type Seg = [number, number, number, number]; // x1,y1,x2,y2

function isValid(...vals: number[]) {
  return vals.every(v => isFinite(v) && !isNaN(v));
}

/** Pull 2D segments (x,z plane) out of a projected LineSegments geometry. */
function toSegments(geo: THREE.BufferGeometry): Seg[] {
  const pos = geo.getAttribute("position");
  const segs: Seg[] = [];
  if (!pos) return segs;
  for (let i = 0; i + 1 < pos.count; i += 2) {
    const x1 = pos.getX(i), y1 = pos.getZ(i);
    const x2 = pos.getX(i + 1), y2 = pos.getZ(i + 1);
    if (isValid(x1, y1, x2, y2)) segs.push([x1, y1, x2, y2]);
  }
  return segs;
}

interface View {
  vis: Seg[];
  minX: number; maxX: number; minY: number; maxY: number;
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
  return { vis, ...boundsOf(vis) };
}

/**
 * End view by projecting B-rep edges to XY (looking down -Z from the tip).
 * Uses shapeToEdges (proven working code) then filters to:
 *   • outer diameter circle (midpoint radius ≈ rBody)
 *   • tip region edges (midpoint Z > 80% of total length) — cutting lips + chisel
 */
function buildEndView(oc: OpenCascadeInstance, shape: unknown, p: DrillParameters): View {
  const rBody = p.diameter / 2;
  const tipZStart = p.length * 0.80;
  const rTol = rBody * 0.06;

  const geo = shapeToEdges(oc, shape);
  const pos = geo.getAttribute("position");
  if (!pos) return { vis: [], minX: 0, maxX: 0, minY: 0, maxY: 0 };

  const segs: Seg[] = [];
  for (let i = 0; i + 1 < pos.count; i += 2) {
    const x1 = pos.getX(i),  y1 = pos.getY(i),  z1 = pos.getZ(i);
    const x2 = pos.getX(i + 1), y2 = pos.getY(i + 1), z2 = pos.getZ(i + 1);
    if (!isValid(x1, y1, z1, x2, y2, z2)) continue;

    const midZ = (z1 + z2) / 2;
    const midR = (Math.hypot(x1, y1) + Math.hypot(x2, y2)) / 2;

    const isOuterCircle = Math.abs(midR - rBody) < rTol;
    const isTipRegion   = midZ > tipZStart;
    if (!isOuterCircle && !isTipRegion) continue;

    // Project to XY plane (drop Z)
    const dx = x2 - x1, dy = y2 - y1;
    if (dx * dx + dy * dy < 0.01) continue;
    segs.push([x1, y1, x2, y2]);
  }

  return { vis: segs, ...boundsOf(segs) };
}

const MIN_SEG_SQ = 0.1 * 0.1; // drop segments shorter than 0.1 mm
const draw = (d: Drawing, segs: Seg[], ox: number, oy: number) => {
  for (const s of segs) {
    const dx = s[2] - s[0], dy = s[3] - s[1];
    if (dx * dx + dy * dy < MIN_SEG_SQ) continue;
    if (!isValid(ox + s[0], oy + s[1], ox + s[2], oy + s[3])) continue;
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
  const end = buildEndView(oc, shape, p);

  const d = new Drawing();
  d.addLineType("CENTER", "Center ____ _ ____ _", [12.7, -2.54, 2.54, -2.54]);
  d.addLayer("Visible", 7, "CONTINUOUS");
  d.addLayer("Center", 1, "CENTER");
  d.addLayer("Text", 3, "CONTINUOUS");

  const sideOx = -side.minX;
  const sideOy = -(side.minY + side.maxY) / 2;
  const gap = Math.max(20, (end.maxX - end.minX) * 0.4);
  const endOx = sideOx + side.maxX + gap - end.minX;
  const endOy = -(end.minY + end.maxY) / 2;

  d.setActiveLayer("Visible");
  draw(d, side.vis, sideOx, sideOy);
  draw(d, end.vis, endOx, endOy);

  d.setActiveLayer("Center");
  d.drawLine(sideOx + side.minX - 6, 0, sideOx + side.maxX + 6, 0);
  const endR = Math.max(end.maxX - end.minX, end.maxY - end.minY) / 2 + 6;
  const endCx = endOx + (end.minX + end.maxX) / 2;
  d.drawLine(endCx - endR, 0, endCx + endR, 0);
  d.drawLine(endCx, -endR, endCx, endR);

  d.setActiveLayer("Text");
  const labelY = Math.min(sideOy + side.minY, endOy + end.minY) - 8;
  d.drawText(sideOx + side.minX, labelY, 4, 0, "SIDE VIEW");
  d.drawText(endOx + end.minX, labelY, 4, 0, "END VIEW");
  d.drawText(
    sideOx + side.minX, labelY - 7, 3, 0,
    `Drill  ${p.diameter}mm x ${p.length}mm  ${p.fluteCount}-flute  ${p.helixAngle}deg helix  ${p.tipAngle}deg point`
  );

  // Inject $ACADVER so AutoCAD opens as editable, not read-only.
  // dxf-writer may or may not indent group codes — try both formats.
  const raw = d.toDxfString();
  const acadVer = "9\n$ACADVER\n  1\nAC1009\n";
  // Try indented format first, then non-indented
  if (raw.includes("  0\nSECTION\n  2\nHEADER\n")) {
    return raw.replace("  0\nSECTION\n  2\nHEADER\n", "  0\nSECTION\n  2\nHEADER\n  " + acadVer);
  }
  if (raw.includes("0\nSECTION\n2\nHEADER\n")) {
    return raw.replace("0\nSECTION\n2\nHEADER\n", "0\nSECTION\n2\nHEADER\n" + acadVer);
  }
  return raw;
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
      const hasAcadver = dxf.includes("$ACADVER");
      console.log(`[dxf] ✅ bytes=${dxf.length}, LINE=${lines}, ACADVER=${hasAcadver}, ${Math.round(performance.now() - t0)}ms`);
      (window as unknown as Record<string, unknown>).__dxf = dxf;
      return { ok: true, bytes: dxf.length, lines, hasAcadver };
    } catch (e) {
      console.error("[dxf] ❌", e);
      return { ok: false, error: String((e as { message?: string })?.message || e) };
    }
  };
}
