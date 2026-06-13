import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ProjectionGenerator } from '@/lib/projectionGenerator';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Layers, Maximize, RotateCcw } from 'lucide-react';

interface EdgeProjectionViewerProps {
  geometry: THREE.BufferGeometry;
  width?: string | number;
  height?: string | number;
  modelColor?: string;
  edgeColor?: string;
  backgroundColor?: string;
}

export function EdgeProjectionViewer({
  geometry,
  width = '100%',
  height = '100%',
  modelColor = '#3f51b5',
  edgeColor = '#ffffff',
  backgroundColor = '#f1f5f9'
}: EdgeProjectionViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<THREE.Mesh | null>(null);
  const projectionRef = useRef<THREE.LineSegments | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const projectionGeneratorRef = useRef<ProjectionGenerator | null>(null);
  
  const [projectionAxis, setProjectionAxis] = useState<'X' | 'Y' | 'Z'>('Z');
  const [showProjection, setShowProjection] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Initialize the 3D scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Setup scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);
    sceneRef.current = scene;

    // Setup camera
    const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    camera.position.set(3, 3, 3);
    cameraRef.current = camera;

    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Setup lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 2, 3);
    scene.add(directionalLight);

    // Setup controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controlsRef.current = controls;

    // Setup model
    const material = new THREE.MeshStandardMaterial({ 
      color: modelColor,
      transparent: true,
      opacity: 0.8
    });
    const model = new THREE.Mesh(geometry.clone(), material);
    scene.add(model);
    modelRef.current = model;

    // Setup projection lineSegments
    const projectionMaterial = new THREE.LineBasicMaterial({
      color: edgeColor,
      linewidth: 2,
      transparent: true,
      opacity: 0.9
    });
    const projectionGeometry = new THREE.BufferGeometry();
    const projection = new THREE.LineSegments(projectionGeometry, projectionMaterial);
    scene.add(projection);
    projectionRef.current = projection;

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

    // Generate initial projections
    generateProjection();

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      
      rendererRef.current.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }

      if (modelRef.current?.geometry) {
        modelRef.current.geometry.dispose();
      }

      if (projectionRef.current?.geometry) {
        projectionRef.current.geometry.dispose();
      }
    };
  }, [geometry, backgroundColor, modelColor, edgeColor]);

  // Generate projection edges
  const generateProjection = async () => {
    if (!projectionGeneratorRef.current || !modelRef.current || !projectionRef.current || isProcessing) return;
    
    setIsProcessing(true);
    setStatusMessage('Processing edges...');

    try {
      // Clone geometry and apply world transform
      const processedGeometry = modelRef.current.geometry.clone();
      processedGeometry.applyMatrix4(modelRef.current.matrixWorld);

      // Configure projection generator
      const generator = projectionGeneratorRef.current;
      generator.angleThreshold = 15; // More sensitive edge detection
      generator.includeIntersectionEdges = true;
      generator.sortEdges = true;

      // Generate edges asynchronously with progress reporting
      const result = await generator.generateAsync(processedGeometry, {
        onProgress: (percent) => {
          setStatusMessage(`Processing: ${Math.round(percent)}%`);
        }
      });

      // Update the projection geometry
      if (projectionRef.current) {
        projectionRef.current.geometry.dispose();
        projectionRef.current.geometry = result;
        projectionRef.current.visible = showProjection;
      }

      setStatusMessage('Processing complete');
    } catch (error) {
      setStatusMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Projection generation error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset the camera view
  const resetView = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    
    cameraRef.current.position.set(3, 3, 3);
    cameraRef.current.lookAt(0, 0, 0);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  // Fit the view to the model
  const zoomToFit = () => {
    if (!cameraRef.current || !controlsRef.current || !modelRef.current) return;
    
    const boundingBox = new THREE.Box3().setFromObject(modelRef.current);
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    
    // Calculate distance needed to view the entire model
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = cameraRef.current.fov * (Math.PI / 180);
    let distance = maxDim / (2 * Math.tan(fov / 2));
    distance *= 1.2; // Add margin
    
    // Set camera position
    const direction = cameraRef.current.position.clone()
      .sub(controlsRef.current.target)
      .normalize()
      .multiplyScalar(distance);
    
    cameraRef.current.position.copy(center).add(direction);
    controlsRef.current.target.copy(center);
    controlsRef.current.update();
  };

  // Toggle projection visibility
  const toggleProjection = () => {
    setShowProjection(!showProjection);
    if (projectionRef.current) {
      projectionRef.current.visible = !showProjection;
    }
  };

  // Change projection axis
  const handleAxisChange = (value: string) => {
    setProjectionAxis(value as 'X' | 'Y' | 'Z');
    // Re-generate projection with new axis
    generateProjection();
  };

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width, 
        height, 
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <Select value={projectionAxis} onValueChange={handleAxisChange}>
          <SelectTrigger className="w-[100px] bg-white/80 hover:bg-white">
            <SelectValue placeholder="Axis" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="X">X Axis</SelectItem>
            <SelectItem value="Y">Y Axis</SelectItem>
            <SelectItem value="Z">Z Axis</SelectItem>
          </SelectContent>
        </Select>
        
        <Button 
          variant="outline" 
          size="icon" 
          onClick={toggleProjection}
          className={`bg-white/80 hover:bg-white ${showProjection ? 'ring-2 ring-primary' : ''}`}
          title={showProjection ? "Hide projections" : "Show projections"}
        >
          <Layers size={18} />
        </Button>
        
        <Button 
          variant="outline" 
          size="icon" 
          onClick={resetView}
          className="bg-white/80 hover:bg-white"
          title="Reset view"
        >
          <RotateCcw size={18} />
        </Button>
        
        <Button 
          variant="outline" 
          size="icon" 
          onClick={zoomToFit}
          className="bg-white/80 hover:bg-white"
          title="Zoom to fit"
        >
          <Maximize size={18} />
        </Button>
      </div>
      
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
          <div className="p-4 bg-white rounded-md shadow-md">
            <div className="animate-spin mr-2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full inline-block"></div>
            <span className="ml-2">{statusMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
} 