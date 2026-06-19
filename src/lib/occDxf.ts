/**
 * 2D engineering drawing (DXF) generated FROM the 3D model, with hidden-line
 * removal via three-edge-projection. Produces a side view + end view, each with
 * visible edges (solid) and hidden edges (dashed) — a real orthographic drawing.
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

function makeView(p: ProjectedView): View {
  const vis = toSegments(p.visible);
  const hid = toSegments(p.hidden);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const s of [...vis, ...hid]) {
    minX = Math.min(minX, s[0], s[2]);
    maxX = Math.max(maxX, s[0], s[2]);
    minY = Math.min(minY, s[1], s[3]);
    maxY = Math.max(maxY, s[1], s[3]);
  }
  if (!isFinite(minX)) { minX = maxX = minY = maxY = 0; }
  return { vis, hid, minX, maxX, minY, maxY };
}

const MIN_SEG = 0.1; // mm — drop anything shorter (eliminates dot artifacts)
const draw = (d: Drawing, segs: Seg[], ox: number, oy: number) => {
  for (const s of segs) {
    const dx = s[2] - s[0], dy = s[3] - s[1];
    if (dx * dx + dy * dy < MIN_SEG * MIN_SEG) continue;
    d.drawLine(ox + s[0], oy + s[1], ox + s[2], oy + s[3]);
  }
};

/** Build a real DXF (side + end views, HLR) projected from the model. */
export async function exportDrillDxf(
  oc: OpenCascadeInstance,
  shape: unknown,
  p: DrillParameters,
  onProgress?: (msg: string) => void
): Promise<string> {
  // Fine tessellation so tip geometry (cutting lips, chisel edge) survives projection.
  const mesh = shapeToBufferGeometry(oc, shape, 0.04, 0.1);

  onProgress?.("Projecting side view…");
  const side = makeView(await projectEdges(mesh, new THREE.Euler(0, Math.PI / 2, 0), 30));
  onProgress?.("Projecting end view…");
  // Use a tight angleThreshold (5°) for the end view so the cutting lips and chisel
  // edge — shallow dihedral where flute meets tip cone — are not filtered away.
  const end = makeView(await projectEdges(mesh, new THREE.Euler(Math.PI / 2, 0, 0), 5));

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
