import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ProjectionGenerator } from '../lib/projectionGenerator';

export const ProjectionExample: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const projectionGeneratorRef = useRef<ProjectionGenerator | null>(null);
  const [showProjections, setShowProjections] = useState(false);

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
    cameraRef.current = camera;

    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Initialize controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Create a simple geometry (cube)
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({
      color: 0x808080,
      shininess: 100,
      specular: 0x666666,
      flatShading: false
    });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // Initialize projection generator
    projectionGeneratorRef.current = new ProjectionGenerator({
      debug: true,
      debugColors: {
        regular: 0x0000ff,      // Blue
        boundary: 0xff0000,     // Red
        intersection: 0x00ff00,  // Green
        normals: 0xff00ff,      // Magenta
        points: 0xffff00        // Yellow
      }
    });

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const toggleProjections = () => {
    if (!sceneRef.current) return;

    setShowProjections(!showProjections);
    
    if (!showProjections) {
      try {
        // Get the cube's geometry
        const cube = sceneRef.current.children.find(
          obj => obj instanceof THREE.Mesh && obj.geometry instanceof THREE.BoxGeometry
        ) as THREE.Mesh;

        if (!cube || !projectionGeneratorRef.current) return;

        // Configure projection generator
        projectionGeneratorRef.current.angleThreshold = 15;
        projectionGeneratorRef.current.includeIntersectionEdges = true;
        projectionGeneratorRef.current.sortEdges = true;

        // Generate edges
        const generator = projectionGeneratorRef.current.generate(cube.geometry);
        const result = generator.next();

        if (result.value) {
          // Create line segments for the edges
          const material = new THREE.LineBasicMaterial({ 
            color: 0xff0000,
            linewidth: 1 
          });
          
          const edgeLines = new THREE.LineSegments(result.value, material);
          sceneRef.current.add(edgeLines);
          
          // Store reference for cleanup
          projectionGeneratorRef.current.debugVisualization = {
            edges: edgeLines,
            boundaryEdges: edgeLines
          };
        }
      } catch (error) {
        console.error('Error generating projections:', error);
      }
    } else {
      // Remove projections
      if (projectionGeneratorRef.current) {
        const debugVis = projectionGeneratorRef.current.getDebugVisualization();
        if (debugVis) {
          Object.values(debugVis).forEach(obj => {
            if (obj && obj instanceof THREE.Object3D) {
              sceneRef.current?.remove(obj);
            }
          });
        }
        projectionGeneratorRef.current.toggleDebugVisualization(false);
      }
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      <button
        onClick={toggleProjections}
        className="absolute top-4 right-4 bg-white p-2 rounded shadow"
      >
        {showProjections ? 'Hide Projections' : 'Show Projections'}
      </button>
    </div>
  );
}; 