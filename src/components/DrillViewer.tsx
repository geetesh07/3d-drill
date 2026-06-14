import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Button } from "@/components/ui/button";
import { Maximize, RotateCcw } from "lucide-react";

export type ViewMode = "shaded" | "edges" | "drawing";

interface DrillViewerProps {
  geometry: THREE.BufferGeometry | null; // surface mesh
  edges: THREE.BufferGeometry | null; // 3D B-rep edge line segments
  projVisible: THREE.BufferGeometry | null; // 2D projection — visible edges
  projHidden: THREE.BufferGeometry | null; // 2D projection — hidden edges
  surfaceFinish?: string;
  mode: ViewMode;
}

function materialFor(finish?: string): THREE.Material {
  const base = { metalness: 0.92, roughness: 0.3, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 };
  switch (finish) {
    case "black-oxide": return new THREE.MeshStandardMaterial({ color: 0x1e293b, ...base });
    case "tin": return new THREE.MeshStandardMaterial({ color: 0xfcd34d, ...base });
    case "aln": return new THREE.MeshStandardMaterial({ color: 0xd1d5db, ...base });
    default: return new THREE.MeshStandardMaterial({ color: 0x9ca3af, ...base });
  }
}

export function DrillViewer({ geometry, edges, projVisible, projHidden, surfaceFinish, mode }: DrillViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const renderRef = useRef<() => void>(() => {});
  const isDrawingRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0c0f);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 5000);
    camera.position.set(120, 90, 120);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(Math.max(1, container.clientWidth), Math.max(1, container.clientHeight));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.0);
    key.position.set(80, 120, 100);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.4);
    fill.position.set(-80, -40, -60);
    scene.add(fill);

    const group = new THREE.Group();
    scene.add(group);
    groupRef.current = group;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controlsRef.current = controls;

    const render = () => renderer.render(scene, camera);
    renderRef.current = render;
    controls.addEventListener("change", render);

    const resize = () => {
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      render();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    window.addEventListener("resize", resize);
    resize();

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", resize);
      controls.removeEventListener("change", render);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    for (let i = group.children.length - 1; i >= 0; i--) {
      const child = group.children[i];
      group.remove(child);
      const mesh = child as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const m = mesh.material;
      if (m) (Array.isArray(m) ? m : [m]).forEach((mm) => mm.dispose());
    }

    const drawing = mode === "drawing";
    isDrawingRef.current = drawing;
    // 3D modes lay the +Z drill axis across the screen; the 2D drawing is already a view.
    group.rotation.set(0, drawing ? 0 : Math.PI / 2, 0);

    if (drawing) {
      if (projVisible) {
        group.add(new THREE.LineSegments(projVisible, new THREE.LineBasicMaterial({ color: 0xe5e7eb })));
      }
      if (projHidden) {
        const g = projHidden.clone();
        const ls = new THREE.LineSegments(g, new THREE.LineDashedMaterial({ color: 0x5b6472, dashSize: 1.2, gapSize: 0.8 }));
        ls.computeLineDistances();
        group.add(ls);
      }
    } else {
      if (mode !== "edges" && geometry) {
        group.add(new THREE.Mesh(geometry, materialFor(surfaceFinish)));
      }
      if (mode === "edges" && edges) {
        group.add(new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x93c5fd })));
      }
    }

    fitView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geometry, edges, projVisible, projHidden, surfaceFinish, mode]);

  const fitView = () => {
    const group = groupRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!group || !camera || !controls || group.children.length === 0) return;

    const box = new THREE.Box3().setFromObject(group);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const dist = (maxDim / (2 * Math.tan((camera.fov * Math.PI) / 360))) * 1.25;

    if (isDrawingRef.current) {
      // Face-on: the 2D drawing lies in the XZ plane (y≈0); look straight down -Y.
      camera.up.set(0, 0, 1);
      camera.position.set(center.x, center.y + dist, center.z);
    } else {
      camera.up.set(0, 1, 0);
      camera.position.set(center.x + dist * 0.15, center.y + dist * 0.45, center.z + dist * 1.0);
    }
    camera.near = maxDim / 100;
    camera.far = maxDim * 100;
    camera.updateProjectionMatrix();
    controls.target.copy(center);
    controls.update();
    renderRef.current();
  };

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <Button variant="outline" size="icon" onClick={fitView} title="Reset / fit view" className="bg-background/70">
          <RotateCcw size={18} />
        </Button>
        <Button variant="outline" size="icon" onClick={fitView} title="Zoom to fit" className="bg-background/70">
          <Maximize size={18} />
        </Button>
      </div>
    </div>
  );
}
