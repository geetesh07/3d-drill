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

const draw = (d: Drawing, segs: Seg[], ox: number, oy: number) => {
  for (const s of segs) d.drawLine(ox + s[0], oy + s[1], ox + s[2], oy + s[3]);
};

/** Build a real DXF (side + end views, HLR) projected from the model. */
export async function exportDrillDxf(
  oc: OpenCascadeInstance,
  shape: unknown,
  p: DrillParameters,
  onProgress?: (msg: string) => void
): Promise<string> {
  // Slightly coarse mesh keeps the projection fast without hurting the outline.
  const mesh = shapeToBufferGeometry(oc, shape, 0.15, 0.4);

  onProgress?.("Projecting side view…");
  const side = makeView(await projectEdges(mesh, new THREE.Euler(0, Math.PI / 2, 0)));
  onProgress?.("Projecting end view…");
  const end = makeView(await projectEdges(mesh, new THREE.Euler(Math.PI / 2, 0, 0)));

  const d = new Drawing();
  d.addLineType("CENTER", "Center ____ _ ____ _", [12.7, -2.54, 2.54, -2.54]);
  d.addLineType("HIDDEN", "Hidden __ __ __", [2.54, -1.27]);
  d.addLayer("Visible", 7, "CONTINUOUS");
  d.addLayer("Hidden", 8, "HIDDEN");
  d.addLayer("Center", 1, "CENTER");
  d.addLayer("Text", 3, "CONTINUOUS");

  // Layout: side view at origin; end view to its right.
  const sideOx = -side.minX;
  const sideOy = -(side.minY + side.maxY) / 2; // center vertically on the axis
  const gap = Math.max(20, (end.maxX - end.minX) * 0.4);
  const endOx = sideOx + side.maxX + gap - end.minX;
  const endOy = -(end.minY + end.maxY) / 2;

  // Visible (solid)
  d.setActiveLayer("Visible");
  draw(d, side.vis, sideOx, sideOy);
  draw(d, end.vis, endOx, endOy);

  // Hidden (dashed)
  d.setActiveLayer("Hidden");
  draw(d, side.hid, sideOx, sideOy);
  draw(d, end.hid, endOx, endOy);

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
