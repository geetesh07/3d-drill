
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { DrillViewer } from '@/components/DrillViewer';
import { Card, CardContent } from '@/components/ui/card';
import { DrillParameters } from '@/types/drill';

const StepdrillGenerator = () => {
  const [searchParams] = useSearchParams();
  
  // Define default parameters for step drill
  const parameters: DrillParameters = {
    diameter: 12,
    length: 100,
    shankDiameter: 8,
    shankLength: 45,
    fluteCount: 2,
    fluteLength: 55,
    nonCuttingLength: 0,
    tipAngle: 135, // Step drills often have a sharper angle
    helixAngle: 28,
    material: 'titanium', // Often have titanium coating
    tolerance: 'h8',
    surfaceFinish: 'black-oxide'
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Step Drill Designer</h1>
        <p className="text-muted-foreground">
          Create multi-diameter step drills for efficient hole making
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

export default StepdrillGenerator;
