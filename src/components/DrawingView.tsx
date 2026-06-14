import { useMemo } from "react";
import * as THREE from "three";

interface DrawingViewProps {
  visible: THREE.BufferGeometry | null;
  hidden: THREE.BufferGeometry | null;
}

type Seg = [number, number, number, number]; // x1,y1,x2,y2 (drawing space, y up)

/** Project a LineSegments geometry to 2D (x, z) with y flipped so up is up. */
function toSegments(geo: THREE.BufferGeometry | null): Seg[] {
  if (!geo) return [];
  const pos = geo.getAttribute("position");
  if (!pos) return [];
  const out: Seg[] = [];
  for (let i = 0; i + 1 < pos.count; i += 2) {
    out.push([pos.getX(i), pos.getZ(i), pos.getX(i + 1), pos.getZ(i + 1)]);
  }
  return out;
}

/**
 * Crisp SVG render of the three-edge-projection result: visible edges solid,
 * hidden edges dashed, with a centerline. Auto-fits — this is the live preview
 * of exactly what the DXF exports.
 */
export function DrawingView({ visible, hidden }: DrawingViewProps) {
  const { vis, hid, box } = useMemo(() => {
    const vis = toSegments(visible);
    const hid = toSegments(hidden);
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const s of [...vis, ...hid]) {
      minX = Math.min(minX, s[0], s[2]);
      maxX = Math.max(maxX, s[0], s[2]);
      minY = Math.min(minY, s[1], s[3]);
      maxY = Math.max(maxY, s[1], s[3]);
    }
    if (!isFinite(minX)) { minX = maxX = minY = maxY = 0; }
    const pad = Math.max(8, (maxX - minX) * 0.08);
    return { vis, hid, box: { minX: minX - pad, minY: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 } };
  }, [visible, hidden]);

  if (vis.length === 0 && hid.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg bg-muted/40 text-sm text-muted-foreground">
        No drawing yet.
      </div>
    );
  }

  const cy = box.minY + box.h / 2;

  return (
    <div className="bg-blueprint h-full w-full overflow-hidden rounded-lg border border-border bg-card/40">
      <svg
        viewBox={`${box.minX} ${box.minY} ${box.w} ${box.h}`}
        className="h-full w-full"
        // SVG y is down; our data is y-up, so flip vertically about the view center.
        style={{ transform: "scaleY(-1)" }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* axis centerline */}
        <line
          x1={box.minX + 2}
          y1={cy}
          x2={box.minX + box.w - 2}
          y2={cy}
          stroke="hsl(var(--primary))"
          strokeWidth={1}
          strokeDasharray="10 3 2 3"
          opacity={0.7}
          vectorEffect="non-scaling-stroke"
        />
        {/* hidden edges (dashed) */}
        <g stroke="#5b6472" strokeWidth={1} strokeDasharray="4 3" vectorEffect="non-scaling-stroke">
          {hid.map((s, i) => (
            <line key={`h${i}`} x1={s[0]} y1={s[1]} x2={s[2]} y2={s[3]} vectorEffect="non-scaling-stroke" />
          ))}
        </g>
        {/* visible edges (solid) */}
        <g stroke="#e5e7eb" strokeWidth={1.4} strokeLinecap="round" vectorEffect="non-scaling-stroke">
          {vis.map((s, i) => (
            <line key={`v${i}`} x1={s[0]} y1={s[1]} x2={s[2]} y2={s[3]} vectorEffect="non-scaling-stroke" />
          ))}
        </g>
      </svg>
    </div>
  );
}
