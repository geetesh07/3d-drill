
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { DrillViewer } from '@/components/DrillViewer';
import { Card, CardContent } from '@/components/ui/card';
import { DrillParameters } from '@/types/drill';

const EndmillGenerator = () => {
  const [searchParams] = useSearchParams();
  
  // Define default parameters for endmill
  const parameters: DrillParameters = {
    diameter: 10,
    length: 85,
    shankDiameter: 10,
    shankLength: 40,
    fluteCount: 4, // Endmills typically have 4 flutes
    fluteLength: 45,
    nonCuttingLength: 0,
    tipAngle: 180, // Flat bottom for endmills
    helixAngle: 30,
    material: 'carbide', // Typically carbide for endmills
    tolerance: 'h7',
    surfaceFinish: 'aln'
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Endmill Designer</h1>
        <p className="text-muted-foreground">
          Design specialized endmills for various machining operations
        </p>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <DrillViewer 
            parameters={parameters} 
            viewMode="3d"
            wireframe={false}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default EndmillGenerator;
