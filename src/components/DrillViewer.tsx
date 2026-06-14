import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Button } from "@/components/ui/button";
import { Maximize, RotateCcw } from "lucide-react";

export type ViewMode = "shaded" | "edges" | "both";

interface DrillViewerProps {
  geometry: THREE.BufferGeometry | null; // surface mesh
  edges: THREE.BufferGeometry | null; // B-rep edge line segments
  surfaceFinish?: string;
  mode: ViewMode;
}

function materialFor(finish?: string): THREE.Material {
  switch (finish) {
    case "black-oxide":
      return new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.45, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
    case "tin":
      return new THREE.MeshStandardMaterial({ color: 0xfcd34d, metalness: 0.85, roughness: 0.3, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
    case "aln":
      return new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.8, roughness: 0.35, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
    default:
      return new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.9, roughness: 0.3, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  }
}

export function DrillViewer({ geometry, edges, surfaceFinish, mode }: DrillViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const renderRef = useRef<() => void>(() => {});

  // One-time scene setup with on-demand rendering.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 5000);
    camera.position.set(120, 90, 120);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(Math.max(1, container.clientWidth), Math.max(1, container.clientHeight));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(80, 120, 100);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.4);
    fill.position.set(-80, -40, -60);
    scene.add(fill);

    const group = new THREE.Group();
    group.rotation.y = Math.PI / 2; // lay the +Z drill axis across the screen
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
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Rebuild model contents when geometry / edges / mode change.
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    // Clear previous contents
    for (let i = group.children.length - 1; i >= 0; i--) {
      const child = group.children[i];
      group.remove(child);
      if ((child as THREE.Mesh).geometry) (child as THREE.Mesh).geometry.dispose();
      const m = (child as THREE.Mesh).material;
      if (m) (Array.isArray(m) ? m : [m]).forEach((mm) => mm.dispose());
    }

    const showSolid = (mode === "shaded" || mode === "both") && geometry;
    const showEdges = (mode === "edges" || mode === "both") && edges;

    if (showSolid && geometry) {
      group.add(new THREE.Mesh(geometry, materialFor(surfaceFinish)));
    }
    if (showEdges && edges) {
      const color = mode === "edges" ? 0x1f2937 : 0x0b1220;
      group.add(new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color })));
    }

    fitView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geometry, edges, surfaceFinish, mode]);

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

    camera.position.set(center.x + dist * 0.15, center.y + dist * 0.45, center.z + dist * 1.0);
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
        <Button variant="outline" size="icon" onClick={fitView} title="Reset / fit view" className="bg-white/80">
          <RotateCcw size={18} />
        </Button>
        <Button variant="outline" size="icon" onClick={fitView} title="Zoom to fit" className="bg-white/80">
          <Maximize size={18} />
        </Button>
      </div>
    </div>
  );
}
