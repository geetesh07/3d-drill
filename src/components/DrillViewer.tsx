import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { generateDrillGeometry, DrillLengthInfo } from '../lib/drillGenerator';
import { DrillParameters } from '@/types/drill';
import { Hand, Loader, Maximize, RotateCcw, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { exportDrillToGLB } from '../lib/exportUtils';
import { AlertTriangle } from 'lucide-react';

interface DrillViewerProps {
  parameters: DrillParameters;
  viewMode: '3d' | '2d';
  wireframe?: boolean;
  debug?: boolean;
  onCameraUpdate?: (camera: THREE.Camera) => void;
}

export function DrillViewer({
  parameters,
  viewMode,
  wireframe = false,
  debug = false,
  onCameraUpdate
}: DrillViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const drillMeshRef = useRef<THREE.Mesh | null>(null);
  const defaultCameraPositionRef = useRef<THREE.Vector3 | null>(null);
  const renderRequestRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isHandMode, setIsHandMode] = useState(false);
  const [showLengthInfo, setShowLengthInfo] = useState(false);
  const [lengthInfo, setLengthInfo] = useState<DrillLengthInfo | null>(null);
  
  // Initialize the scene, camera, renderer and controls
  useEffect(() => {
    if (!containerRef.current) return;
    
    try {
      // Check WebGL compatibility
      if (!isWebGLAvailable()) {
        setRenderError('WebGL is not available in your browser. Please use a browser that supports WebGL.');
        return;
      }

      // Set up scene
        const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf1f5f9);
        sceneRef.current = scene;

      // Set up camera
      const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
      camera.position.set(0, 0, 50);
        cameraRef.current = camera;
      
      // Set up renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

      // Set up lighting for better visibility
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(10, 20, 15);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        
      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
      directionalLight2.position.set(-10, -10, 10);
      scene.add(directionalLight2);
      
      // Set up controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
      controls.dampingFactor = 0.1;
      controls.rotateSpeed = 1.0;
        controls.panSpeed = 0.8;
        controls.zoomSpeed = 1.2;
        controlsRef.current = controls;

      // Add a grid helper
      const gridHelper = new THREE.GridHelper(50, 50, 0xaaaaaa, 0xdddddd);
      gridHelper.position.y = -parameters.length / 2;
      scene.add(gridHelper);
      
      // Add coordinate axes
      const axesHelper = new THREE.AxesHelper(10);
      scene.add(axesHelper);
      
      // Set up animation loop
        const animate = () => {
        renderRequestRef.current = requestAnimationFrame(animate);
          
          if (controlsRef.current) {
            controlsRef.current.update();
          }
          
        if (sceneRef.current && cameraRef.current && rendererRef.current) {
            rendererRef.current.render(sceneRef.current, cameraRef.current);
          
          if (onCameraUpdate && cameraRef.current) {
            onCameraUpdate(cameraRef.current);
          }
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
      
      return () => {
        window.removeEventListener('resize', handleResize);
        
        if (renderRequestRef.current !== null) {
          cancelAnimationFrame(renderRequestRef.current);
        }
        
        if (rendererRef.current && containerRef.current) {
          containerRef.current.removeChild(rendererRef.current.domElement);
          rendererRef.current.dispose();
        }
      };
    } catch (error) {
      console.error('Error initializing 3D scene:', error);
      setRenderError(`Failed to initialize 3D scene: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [onCameraUpdate, parameters.length]);

  useEffect(() => {
    if (!sceneRef.current) return;
    
    setIsLoading(true);
    console.log('Updating drill model with parameters:', parameters);
    
    try {
      if (cameraRef.current && controlsRef.current && drillMeshRef.current) {
        defaultCameraPositionRef.current = cameraRef.current.position.clone();
      }
      
      // Clean up old drill model
      if (drillMeshRef.current && sceneRef.current) {
        sceneRef.current.remove(drillMeshRef.current);
        drillMeshRef.current.geometry.dispose();
        if (drillMeshRef.current.material instanceof THREE.Material) {
          drillMeshRef.current.material.dispose();
        } else if (Array.isArray(drillMeshRef.current.material)) {
          drillMeshRef.current.material.forEach(m => m.dispose());
        }
      }
      
      // Generate new drill geometry with length info callback
      const drillGeometry = generateDrillGeometry(
        parameters, 
        (info) => {
          setLengthInfo(info);
          console.log('Drill length info:', info);
        }
      );
      
      // Create material based on parameters with better visibility
      let material: THREE.Material;
      
      if (wireframe) {
        // Always use black color for wireframe mode
        material = new THREE.MeshBasicMaterial({
          color: 0x000000,  // Black color
          wireframe: true,
          wireframeLinewidth: 1
        });
      } else {
      // Default shiny gray material
      material = new THREE.MeshPhongMaterial({
        color: '#808080',  // Medium gray
        shininess: 100,   // High shininess for metallic look
        specular: 0x666666,  // Gray specular highlights
        emissive: 0x000000,
          flatShading: false
      });
      
      // Apply surface finish effects with better visibility
      if (parameters.surfaceFinish === 'black-oxide') {
        material = new THREE.MeshPhongMaterial({
          color: 0x1e293b,
          shininess: 40,
          specular: 0x333333,
          emissive: 0x000000,
            flatShading: false
        });
      } else if (parameters.surfaceFinish === 'tin') {
        material = new THREE.MeshPhongMaterial({
          color: 0xfcd34d,
          shininess: 90,
          specular: 0x777777,
          emissive: 0x000000,
            flatShading: false
        });
      } else if (parameters.surfaceFinish === 'aln') {
        material = new THREE.MeshPhongMaterial({
          color: 0xd1d5db,
          shininess: 85,
          specular: 0x666666,
          emissive: 0x000000,
            flatShading: false
        });
        }
      }
      
      // Create mesh and add to scene
      const drillMesh = new THREE.Mesh(drillGeometry, material);
      
      // Rotate the drill to be horizontal
      drillMesh.rotation.z = -Math.PI / 2; // Rotate 90 degrees to make it horizontal
      
      drillMesh.castShadow = true;
      drillMesh.receiveShadow = true;
      
      sceneRef.current.add(drillMesh);
      drillMeshRef.current = drillMesh;
      
      // Automatically fit the view to the drill
      setTimeout(() => {
        // Always use 3D view mode
        const maxDimension = Math.max(
          parameters.length,
          parameters.diameter * 2,
          parameters.shankDiameter * 2
        );
        
        const cameraDistance = maxDimension * 2;
        if (cameraRef.current && controlsRef.current) {
          // Position camera differently for horizontal drill
          cameraRef.current.position.set(
            cameraDistance * 0.7,
            cameraDistance * 0.5,
            cameraDistance * 0.7
          );
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }
        
        // Force an immediate render
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
        
        setIsLoading(false);
      }, 100);
      
    } catch (error) {
      console.error('Error updating drill model:', error);
      setRenderError(`Failed to update drill model: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  }, [parameters, viewMode, wireframe, debug]);

  const resetView = () => {
    if (cameraRef.current && controlsRef.current) {
      const maxDimension = Math.max(
        parameters.length,
        parameters.diameter * 2,
        parameters.shankDiameter * 2
      );
      
      const cameraDistance = maxDimension * 2;
      // Position camera for horizontal drill
      cameraRef.current.position.set(
        cameraDistance * 0.7,
        cameraDistance * 0.5,
        cameraDistance * 0.7
      );
      
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  const zoomToFit = () => {
    if (!cameraRef.current || !controlsRef.current || !drillMeshRef.current) return;
    
    const boundingBox = new THREE.Box3().setFromObject(drillMeshRef.current);
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = cameraRef.current.fov * (Math.PI / 180);
    let dist = maxDim / (2 * Math.tan(fov / 2));
    
    // Add a margin for better visibility
    dist *= 1.2;
    
    // Calculate a good position for the camera to view the horizontal drill
    const newPosition = new THREE.Vector3(
      center.x + dist * 0.7,
      center.y + dist * 0.5,
      center.z + dist * 0.7
    );
    
    cameraRef.current.position.copy(newPosition);
    controlsRef.current.target.copy(center);
    controlsRef.current.update();
  };

  const toggleHandMode = () => {
    setIsHandMode(!isHandMode);
    if (controlsRef.current) {
      controlsRef.current.enableRotate = !isHandMode;
    }
  };

  const toggleLengthInfo = () => {
    setShowLengthInfo(!showLengthInfo);
  };

  const formatLength = (value: number | undefined): string => {
    if (value === undefined) return 'N/A';
    return value.toFixed(2) + ' mm';
  };

  // Keep only the GLB export function
  const exportToGLB = () => {
    try {
      toast.loading('Generating GLB file...');
      
      // Generate a meaningful filename based on drill parameters
      const filename = `drill_${parameters.diameter}x${parameters.length}_${parameters.material}`;
      
      // Call the export utility function with horizontal orientation
      exportDrillToGLB(parameters, filename, true)
        .then(() => {
          toast.dismiss();
          toast.success('GLB exported successfully');
        })
        .catch((error) => {
          console.error('GLB export error:', error);
          toast.dismiss();
          toast.error('Failed to export GLB: ' + (error instanceof Error ? error.message : 'Unknown error'));
        });
    } catch (error) {
      console.error('GLB export error:', error);
      toast.dismiss();
      toast.error('Failed to export GLB: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
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
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={toggleLengthInfo}
          className={`bg-white/80 hover:bg-white ${showLengthInfo ? 'ring-2 ring-primary' : ''}`}
          title="Show length information"
        >
          <Info size={18} />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={exportToGLB}
          className="bg-white/80 hover:bg-white"
          title="Export to GLB (horizontal)"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <path d="M12 18v-6"></path>
            <path d="m9 15 3 3 3-3"></path>
          </svg>
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={toggleHandMode}
          className={`bg-white/80 hover:bg-white ${isHandMode ? 'ring-2 ring-primary' : ''}`}
          title={isHandMode ? "Disable hand mode" : "Enable hand mode (drag model)"}
        >
          <Hand size={18} />
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
      
      {/* Length information panel */}
      {showLengthInfo && lengthInfo && (
        <div className="absolute bottom-2 left-2 z-10 bg-white/90 p-3 rounded-md shadow-md max-w-xs">
          <h3 className="font-bold mb-2">Drill Length Information</h3>
          <table className="text-sm">
            <tbody>
              <tr>
                <td className="pr-4 font-medium">Total Length:</td>
                <td>{formatLength(lengthInfo.totalLength)}</td>
              </tr>
              <tr>
                <td className="pr-4 font-medium">Shank Length:</td>
                <td>{formatLength(lengthInfo.shankLength)}</td>
              </tr>
              {lengthInfo.chamferLength > 0 && (
                <tr>
                  <td className="pr-4 font-medium">Chamfer:</td>
                  <td>{formatLength(lengthInfo.chamferLength)}</td>
                </tr>
              )}
              {lengthInfo.nonCuttingLength > 0 && (
                <tr>
                  <td className="pr-4 font-medium">Non-Cutting:</td>
                  <td>{formatLength(lengthInfo.nonCuttingLength)}</td>
                </tr>
              )}
              <tr>
                <td className="pr-4 font-medium">Flute Length:</td>
                <td>{formatLength(lengthInfo.fluteLength)}</td>
              </tr>
              <tr>
                <td className="pr-4 font-medium">Accurate Flute:</td>
                <td>{formatLength(lengthInfo.accurateFluteLength)}</td>
              </tr>
              <tr>
                <td className="pr-4 font-medium">Extension Length:</td>
                <td>{formatLength(lengthInfo.extensionLength)}</td>
              </tr>
              <tr>
                <td className="pr-4 font-medium">Tip Length:</td>
                <td>{formatLength(lengthInfo.tipLength)}</td>
              </tr>
              <tr>
                <td className="pr-4 font-medium">Curve Exit:</td>
                <td>{lengthInfo.exitPoint.toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
          <div className="p-4 bg-white rounded-md shadow-md">
            <Loader className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2">Loading drill model...</span>
          </div>
        </div>
      )}
      
      {renderError && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50">
          <div className="p-4 text-red-800 bg-white rounded-md shadow-md">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <span className="ml-2">{renderError}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && 
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}