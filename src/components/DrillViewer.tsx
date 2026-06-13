import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Button } from "@/components/ui/button";
import { Maximize, RotateCcw } from "lucide-react";

interface DrillViewerProps {
  geometry: THREE.BufferGeometry | null;
  surfaceFinish?: string;
}

function materialFor(finish?: string): THREE.Material {
  switch (finish) {
    case "black-oxide":
      return new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.45 });
    case "tin":
      return new THREE.MeshStandardMaterial({ color: 0xfcd34d, metalness: 0.85, roughness: 0.3 });
    case "aln":
      return new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.8, roughness: 0.35 });
    default:
      return new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.9, roughness: 0.3 });
  }
}

export function DrillViewer({ geometry, surfaceFinish }: DrillViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const renderRef = useRef<() => void>(() => {});

  // One-time scene setup with on-demand rendering (renders only when the view changes).
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

  // Swap geometry when it changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !geometry) return;

    if (meshRef.current) {
      scene.remove(meshRef.current);
      meshRef.current.geometry.dispose();
      (meshRef.current.material as THREE.Material).dispose();
      meshRef.current = null;
    }

    const geom = geometry.clone();
    geom.center();
    const mesh = new THREE.Mesh(geom, materialFor(surfaceFinish));
    mesh.rotation.y = Math.PI / 2; // lay the +Z drill axis across the screen
    scene.add(mesh);
    meshRef.current = mesh;

    fitView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geometry, surfaceFinish]);

  const fitView = () => {
    const mesh = meshRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!mesh || !camera || !controls) return;

    const box = new THREE.Box3().setFromObject(mesh);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const dist = (maxDim / (2 * Math.tan((camera.fov * Math.PI) / 360))) * 1.25;

    // View mostly side-on (drill axis runs along world X) with a slight 3/4 tilt
    // so the full length reads horizontally and the flutes/tip stay visible.
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
        <Button variant="outline" size="icon" onClick={fitView} title="Reset view" className="bg-white/80">
          <RotateCcw size={18} />
        </Button>
        <Button variant="outline" size="icon" onClick={fitView} title="Zoom to fit" className="bg-white/80">
          <Maximize size={18} />
        </Button>
      </div>
    </div>
  );
}
