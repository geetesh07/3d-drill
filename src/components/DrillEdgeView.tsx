import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { generateDrillGeometry } from '../lib/drillGenerator';
import { DrillParameters } from '@/types/drill';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

interface DrillEdgeViewProps {
  parameters: DrillParameters;
}

export const DrillEdgeView: React.FC<DrillEdgeViewProps> = React.memo(({ parameters }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const [showEdges, setShowEdges] = useState(false);
  const drillMeshRef = useRef<THREE.Mesh | null>(null);
  const edgeLinesRef = useRef<THREE.LineSegments | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Setup scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Setup orthographic camera for 2D view
    const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
    const camera = new THREE.OrthographicCamera(
      -parameters.diameter * 2,
      parameters.diameter * 2,
      parameters.length,
      -parameters.length,
      0.1,
      1000
    );
    camera.position.set(0, 0, 50);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Generate drill geometry
    const drillGeometry = generateDrillGeometry(parameters);
    const material = new THREE.MeshPhongMaterial({
      color: 0x808080,
      shininess: 100,
      specular: 0x666666,
      emissive: 0x000000,
      flatShading: false
    });

    // Create drill mesh
    const drillMesh = new THREE.Mesh(drillGeometry, material);
    scene.add(drillMesh);
    drillMeshRef.current = drillMesh;

    // Create edges geometry
    const edgesGeometry = new THREE.EdgesGeometry(drillGeometry);
    const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
    const edgeLines = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    edgeLines.visible = showEdges;
    scene.add(edgeLines);
    edgeLinesRef.current = edgeLines;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 10, 15);
    scene.add(directionalLight);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      drillGeometry.dispose();
      material.dispose();
      edgesGeometry.dispose();
      edgesMaterial.dispose();
    };
  }, [parameters]);

  useEffect(() => {
    if (edgeLinesRef.current) {
      edgeLinesRef.current.visible = showEdges;
    }
  }, [showEdges]);

  const toggleEdges = () => {
    setShowEdges(!showEdges);
  };

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'relative'
      }}
    >
      <div className="absolute top-2 right-2 z-10">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={toggleEdges}
          className={`bg-white/80 hover:bg-white ${showEdges ? 'ring-2 ring-primary' : ''}`}
          title={showEdges ? "Hide edges" : "Show edges"}
        >
          <Eye size={18} />
        </Button>
      </div>
    </div>
  );
}); 