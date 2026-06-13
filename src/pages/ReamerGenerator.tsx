
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { DrillViewer } from '@/components/DrillViewer';
import { Card, CardContent } from '@/components/ui/card';
import { DrillParameters } from '@/types/drill';

const ReamerGenerator = () => {
  const [searchParams] = useSearchParams();
  
  // Define default parameters for reamer
  const parameters: DrillParameters = {
    diameter: 10,
    length: 90,
    shankDiameter: 10,
    shankLength: 40,
    fluteCount: 6, // Reamers typically have more flutes
    fluteLength: 50,
    nonCuttingLength: 0,
    tipAngle: 170, // Slight angle for reamers
    helixAngle: 15, // Lower helix angle for reamers
    material: 'hss',
    tolerance: 'h6', // Tighter tolerance for reamers
    surfaceFinish: 'polished'
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Reamer Designer</h1>
        <p className="text-muted-foreground">
          Design high-precision reamers with exact specifications
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

export default ReamerGenerator;
