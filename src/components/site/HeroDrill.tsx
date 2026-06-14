import { useEffect, useRef } from "react";
import * as THREE from "three";
import { CSG } from "three-csg-ts";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/**
 * Decorative hero drill — procedural Three.js (NOT the OpenCASCADE pipeline).
 * Flutes are real CSG subtractions (grooves cut into the body), and a studio
 * environment makes the metal read bright. Auto-rotates; paused off-screen and
 * under prefers-reduced-motion.
 */
class HelixCurve extends THREE.Curve<THREE.Vector3> {
  constructor(
    private radius: number,
    private yStart: number,
    private height: number,
    private turns: number,
    private phase: number
  ) {
    super();
  }
  getPoint(t: number, target = new THREE.Vector3()) {
    const a = this.phase + t * this.turns * Math.PI * 2;
    return target.set(
      this.radius * Math.cos(a),
      this.yStart + t * this.height,
      this.radius * Math.sin(a)
    );
  }
}

function buildDrill(): THREE.Group {
  const group = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({ color: 0xc6ccd6, metalness: 1.0, roughness: 0.22 });

  const R = 0.5;
  // Body spans y = -2.1 (tip end) .. 2.3 (shank end). Low-poly so the CSG flute
  // subtraction stays fast (the mesh is small and rotating — facets don't show).
  let body: THREE.Mesh = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 4.4, 36), steel);
  body.updateMatrix();

  // Subtract two helical flute cutters from the lower (cutting) region.
  try {
    for (let i = 0; i < 2; i++) {
      const curve = new HelixCurve(R, -2.0, 3.0, 2.3, i * Math.PI);
      const cutterGeom = new THREE.TubeGeometry(curve, 70, 0.135, 6, false);
      const cutter = new THREE.Mesh(cutterGeom, steel);
      cutter.updateMatrix();
      body = CSG.subtract(body, cutter);
    }
    body.geometry.computeVertexNormals();
    if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__heroInfo = { csg: true, verts: body.geometry.getAttribute("position").count };
  } catch (e) {
    body = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 4.4, 64), steel);
    if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__heroInfo = { csg: false, error: String(e) };
  }
  group.add(body);

  // Conical point
  const tip = new THREE.Mesh(new THREE.ConeGeometry(R, 0.72, 64), steel);
  tip.position.y = -2.46;
  tip.rotation.x = Math.PI;
  group.add(tip);

  group.rotation.z = 0.3;
  return group;
}

export function HeroDrill({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(3.4, 1.4, 6.4);
    camera.lookAt(0, -0.2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    el.appendChild(renderer.domElement);

    // Studio environment so the metal reflects something (otherwise it renders black)
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    scene.add(new THREE.AmbientLight(0xffffff, 0.25));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(5, 7, 6);
    scene.add(keyLight);
    const rim = new THREE.PointLight(0x3b9dff, 22, 30); // electric-blue rim
    rim.position.set(-4.5, -0.5, -2.5);
    scene.add(rim);

    const drill = buildDrill();
    scene.add(drill);

    let raf = 0;
    let running = true;
    const render = () => renderer.render(scene, camera);
    const tick = () => {
      if (!running) return;
      drill.rotation.y += 0.0042;
      render();
      raf = requestAnimationFrame(tick);
    };

    const resize = () => {
      const w = Math.max(1, el.clientWidth);
      const h = Math.max(1, el.clientHeight);
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      render();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    const io = new IntersectionObserver(
      ([entry]) => {
        running = entry.isIntersecting && !reduce;
        if (running) tick();
        else cancelAnimationFrame(raf);
      },
      { threshold: 0.01 }
    );
    io.observe(el);
    if (reduce) render();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      pmrem.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={ref} className={className} aria-hidden="true" />;
}
