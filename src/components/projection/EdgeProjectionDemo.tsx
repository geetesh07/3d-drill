import React, { useState } from 'react';
import * as THREE from 'three';
import { EdgeProjectionViewer } from './EdgeProjectionViewer';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';

export function EdgeProjectionDemo() {
  const [modelType, setModelType] = useState<string>('drill');
  
  // Create drill geometry
  const createDrillGeometry = (): THREE.BufferGeometry => {
    // Create cylinder for the drill body
    const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 3, 32);
    
    // Create cone for the drill tip
    const tipGeometry = new THREE.ConeGeometry(0.5, 1, 32);
    tipGeometry.translate(0, -2, 0);
    
    // Create flute cutouts
    const fluteCutout1 = new THREE.BoxGeometry(0.2, 3, 0.5);
    fluteCutout1.translate(0.3, -0.5, 0);
    
    const fluteCutout2 = new THREE.BoxGeometry(0.2, 3, 0.5);
    fluteCutout2.translate(-0.3, -0.5, 0);
    
    // Create CSG operations using Three.js built-in methods
    // Merge body and tip
    const drillMesh = new THREE.Mesh(bodyGeometry);
    const tipMesh = new THREE.Mesh(tipGeometry);
    
    // Create flute cutouts
    const fluteMesh1 = new THREE.Mesh(fluteCutout1);
    const fluteMesh2 = new THREE.Mesh(fluteCutout2);
    
    // Create a BSP-like effect by combining geometries
    const drillGeometry = bodyGeometry.clone();
    
    // We'll manually add the tip vertices to the drill geometry
    const positions = drillGeometry.getAttribute('position').array as Float32Array;
    const tipPositions = tipGeometry.getAttribute('position').array as Float32Array;
    
    // Create a new buffer with combined vertices
    const newPositions = new Float32Array(positions.length + tipPositions.length);
    newPositions.set(positions, 0);
    newPositions.set(tipPositions, positions.length);
    
    // Create a simple merged geometry
    const mergedGeometry = new THREE.BufferGeometry();
    mergedGeometry.setAttribute('position', new THREE.BufferAttribute(newPositions, 3));
    mergedGeometry.computeVertexNormals();
    
    return mergedGeometry;
  };
  
  // Create different sample geometries
  const getGeometry = (): THREE.BufferGeometry => {
    switch(modelType) {
      case 'drill':
        return createDrillGeometry();
      case 'torus':
        return new THREE.TorusKnotGeometry(1, 0.3, 100, 16);
      case 'cube':
        return new THREE.BoxGeometry(2, 2, 2);
      case 'sphere':
        return new THREE.SphereGeometry(1.5, 32, 32);
      default:
        return createDrillGeometry();
    }
  };
  
  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle>Technical Drawing Edge Projection</CardTitle>
        <CardDescription>
          Visualize 3D models as 2D technical drawings with accurate edge projection
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Tabs defaultValue="drill" onValueChange={setModelType}>
          <TabsList className="mb-4">
            <TabsTrigger value="drill">Drill</TabsTrigger>
            <TabsTrigger value="torus">Torus Knot</TabsTrigger>
            <TabsTrigger value="cube">Cube</TabsTrigger>
            <TabsTrigger value="sphere">Sphere</TabsTrigger>
          </TabsList>
          
          <TabsContent value="drill" className="h-[500px]">
            <EdgeProjectionViewer 
              geometry={getGeometry()} 
              height="100%" 
              modelColor="#607d8b"
              edgeColor="#ffffff"
              backgroundColor="#1e293b"
            />
          </TabsContent>
          
          <TabsContent value="torus" className="h-[500px]">
            <EdgeProjectionViewer 
              geometry={getGeometry()} 
              height="100%" 
              modelColor="#3f51b5"
              edgeColor="#ffffff"
              backgroundColor="#1e293b"
            />
          </TabsContent>
          
          <TabsContent value="cube" className="h-[500px]">
            <EdgeProjectionViewer 
              geometry={getGeometry()} 
              height="100%" 
              modelColor="#2196f3"
              edgeColor="#ffffff"
              backgroundColor="#1e293b"
            />
          </TabsContent>
          
          <TabsContent value="sphere" className="h-[500px]">
            <EdgeProjectionViewer 
              geometry={getGeometry()} 
              height="100%" 
              modelColor="#4caf50"
              edgeColor="#ffffff"
              backgroundColor="#1e293b"
            />
          </TabsContent>
        </Tabs>
        
        <div className="text-sm mt-2">
          <p className="text-muted-foreground mb-2">
            This component demonstrates how 3D models can be projected into 2D technical drawings
            using edge detection algorithms. Use the controls in the top-right to:
          </p>
          <ul className="list-disc pl-5 text-muted-foreground space-y-1">
            <li>Change the projection axis (X, Y, or Z)</li>
            <li>Toggle edge projection visibility</li>
            <li>Reset the camera view</li>
            <li>Zoom to fit the model in view</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
} 