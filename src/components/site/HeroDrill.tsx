import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Decorative, lightweight WebGL drill for the hero — procedural Three.js (NOT the
 * OpenCASCADE pipeline), so it loads instantly. Slow auto-rotation, electric-blue
 * rim light, paused when off-screen and disabled under prefers-reduced-motion.
 */
class HelixCurve extends THREE.Curve<THREE.Vector3> {
  constructor(
    private radius: number,
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
      -this.height / 2 + t * this.height,
      this.radius * Math.sin(a)
    );
  }
}

export function HeroDrill({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(3.2, 1.6, 6.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);
    const rim = new THREE.PointLight(0x3b9dff, 14, 30); // electric-blue rim
    rim.position.set(-4, -1, -3);
    scene.add(rim);

    // Drill group (axis along Y)
    const drill = new THREE.Group();
    const steel = new THREE.MeshStandardMaterial({ color: 0xb9c0cc, metalness: 0.95, roughness: 0.28 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x6b7480, metalness: 0.9, roughness: 0.4 });

    const shank = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2.2, 48), steel);
    shank.position.y = 1.4;
    drill.add(shank);

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 3.2, 48), steel);
    body.position.y = -0.9;
    drill.add(body);

    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.7, 48), steel);
    tip.position.y = -2.85;
    tip.rotation.x = Math.PI;
    drill.add(tip);

    // Helical flute accents
    for (let i = 0; i < 2; i++) {
      const curve = new HelixCurve(0.5, 3.2, 2.2, i * Math.PI);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 220, 0.07, 12, false), dark);
      tube.position.y = -0.9;
      drill.add(tube);
    }

    drill.rotation.z = 0.32;
    scene.add(drill);

    let raf = 0;
    let running = true;
    const render = () => renderer.render(scene, camera);
    const tick = () => {
      if (!running) return;
      drill.rotation.y += 0.0045;
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

    // Pause when off-screen
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
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={ref} className={className} aria-hidden="true" />;
}
