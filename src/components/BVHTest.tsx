import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { MeshBVH, computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import { Button } from './ui/button';
import { toast } from 'react-hot-toast';

// Patch THREE to enable BVH support
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

export function BVHTest() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Initialize camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Create a simple cylinder
    const geometry = new THREE.CylinderGeometry(1, 1, 2, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const cylinder = new THREE.Mesh(geometry, material);
    
    // Enable BVH
    cylinder.geometry.computeBoundsTree();
    scene.add(cylinder);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      cylinder.rotation.y += 0.01;
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
    };
  }, []);

  const handleExport = () => {
    if (!sceneRef.current || !cameraRef.current) return;

    try {
      const cylinder = sceneRef.current.children.find(
        child => child instanceof THREE.Mesh && child.geometry instanceof THREE.CylinderGeometry
      ) as THREE.Mesh;

      if (!cylinder) {
        toast.error('No cylinder found in scene');
        return;
      }

      // Generate DXF content
      let dxf = `0
SECTION
2
HEADER
9
$ACADVER
1
AC1027
0
ENDSEC
0
SECTION
2
ENTITIES`;

      // Add basic cylinder outline
      const radius = 1;
      const height = 2;
      const segments = 32;
      
      // Draw top circle
      for (let i = 0; i < segments; i++) {
        const angle1 = (i / segments) * Math.PI * 2;
        const angle2 = ((i + 1) / segments) * Math.PI * 2;
        
        dxf += `
0
LINE
8
0
10
${Math.cos(angle1) * radius * 100}
20
${Math.sin(angle1) * radius * 100}
30
${height * 50}
11
${Math.cos(angle2) * radius * 100}
21
${Math.sin(angle2) * radius * 100}
31
${height * 50}`;
      }

      // Draw bottom circle
      for (let i = 0; i < segments; i++) {
        const angle1 = (i / segments) * Math.PI * 2;
        const angle2 = ((i + 1) / segments) * Math.PI * 2;
        
        dxf += `
0
LINE
8
0
10
${Math.cos(angle1) * radius * 100}
20
${Math.sin(angle1) * radius * 100}
30
0
11
${Math.cos(angle2) * radius * 100}
21
${Math.sin(angle2) * radius * 100}
31
0`;
      }

      // Draw vertical lines
      for (let i = 0; i < segments; i += 8) {
        const angle = (i / segments) * Math.PI * 2;
        
        dxf += `
0
LINE
8
0
10
${Math.cos(angle) * radius * 100}
20
${Math.sin(angle) * radius * 100}
30
0
11
${Math.cos(angle) * radius * 100}
21
${Math.sin(angle) * radius * 100}
31
${height * 50}`;
      }

      // Close the DXF file
      dxf += `
0
ENDSEC
0
EOF`;

      // Create and download DXF file
      const blob = new Blob([dxf], { type: 'application/dxf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'cylinder_test.dxf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('DXF exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export DXF');
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h1 className="text-2xl font-bold">BVH and Edge Projection Test</h1>
      <div 
        ref={containerRef} 
        className="w-full h-[500px] border border-gray-300 rounded-lg"
      />
      <Button onClick={handleExport}>Export DXF</Button>
    </div>
  );
}