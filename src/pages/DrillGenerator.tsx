import React, { useState, useCallback } from 'react';
import { DrillViewer } from '@/components/DrillViewer';
import { Card, CardContent } from '@/components/ui/card';
import { DrillParameters } from '@/types/drill';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ParameterInput from '@/components/ParameterInput';
import { toast } from 'sonner';
import { exportDrillModel } from '@/lib/exportUtils';
import { useSettings } from '@/context/SettingsContext';
import { Switch } from '@/components/ui/switch';
import { Bell, BellOff } from 'lucide-react';
import LoadingBar from '@/components/LoadingBar';
import ExportLoadingIndicator from '@/components/ExportLoadingIndicator';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const DrillGenerator = () => {
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const { showToasts, setShowToasts } = useSettings();
  const [parameters, setParameters] = useState<DrillParameters>({
    diameter: 10,
    length: 100,
    shankDiameter: 10,
    shankLength: 30,
    fluteCount: 2,
    fluteLength: 60,
    nonCuttingLength: 10,
    tipAngle: 118,
    helixAngle: 30,
    material: 'hss',
    surfaceFinish: 'polished'
  });
  const [isModelGenerated, setIsModelGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'stl' | 'dxf'>('stl');
  const [validateInput, setValidateInput] = useState(false);

  const handleParameterChange = useCallback((key: keyof DrillParameters, value: any) => {
    setParameters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const handleReset = useCallback(() => {
    setParameters({
      diameter: 10,
      length: 100,
      shankDiameter: 10,
      shankLength: 30,
      fluteCount: 2,
      fluteLength: 60,
      nonCuttingLength: 10,
      tipAngle: 118,
      helixAngle: 30,
      material: 'hss',
      surfaceFinish: 'polished'
    });
    setIsModelGenerated(false);
  }, []);

  const handleGenerateModel = useCallback(() => {
    if (validateInput) {
      if (parameters.diameter <= 0 || parameters.length <= 0 || 
          parameters.shankDiameter <= 0 || parameters.shankLength <= 0) {
        if (showToasts) {
          toast.error('Invalid parameters', {
            description: 'Please enter valid values for diameter, length, shank diameter, and shank length.',
          });
        }
        return;
      }
    }

    setIsGenerating(true);
    
    setTimeout(() => {
      try {
        setIsModelGenerated(true);
        if (showToasts) {
          toast('Drill model generated successfully', {
            description: 'You can now view the 3D model and export it if needed.',
          });
        }
      } catch (error) {
        console.error('Model generation error:', error);
        if (showToasts) {
          toast.error('Failed to generate model', {
            description: error instanceof Error ? error.message : 'Unknown error occurred',
          });
        }
      } finally {
        setIsGenerating(false);
      }
    }, 15000);
  }, [parameters, showToasts, validateInput]);

  const handleExport = useCallback(async (format: 'stl' | 'dxf') => {
    if (!isModelGenerated) {
      if (showToasts) {
        toast.error('Please generate the model first');
      }
      return;
    }

    setIsExporting(true);
    setExportFormat(format);
    
    try {
      const filename = `Drill_${parameters.diameter}x${parameters.length}_${parameters.fluteCount}F`;
      await exportDrillModel(parameters, format, filename, showToasts);
      if (showToasts) {
        toast.success(`Model exported as ${format.toUpperCase()}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      if (showToasts) {
        toast.error('Failed to export model', {
          description: error instanceof Error ? error.message : 'Unknown error occurred',
        });
      }
    } finally {
      setIsExporting(false);
    }
  }, [parameters, isModelGenerated, showToasts]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Drill Designer</h1>
        <p className="text-muted-foreground">
          Create custom drill bits with precise parameters
        </p>
      </div>
      
      <div className="flex items-center justify-between">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as '3d' | '2d')}>
          <TabsList>
            <TabsTrigger value="3d">3D View</TabsTrigger>
            <TabsTrigger value="2d">2D View</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={validateInput}
              onCheckedChange={setValidateInput}
              id="validate-input"
            />
            <Label htmlFor="validate-input">Validate Input</Label>
          </div>
          
          <div className="flex items-center gap-2">
            {showToasts ? (
              <Button variant="outline" size="icon" onClick={() => setShowToasts(false)}>
                <BellOff className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="outline" size="icon" onClick={() => setShowToasts(true)}>
                <Bell className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-[400px_1fr] gap-6">
        <ParameterInput 
          parameters={parameters}
          onParameterChange={handleParameterChange}
          onReset={handleReset}
          onExport={handleExport}
          onGenerateModel={handleGenerateModel}
          isGenerating={isGenerating}
          validateInput={validateInput}
        />

        <Card className="dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="aspect-video">
              {isModelGenerated ? (
                <DrillViewer 
                  parameters={parameters}
                  viewMode={viewMode}
                  wireframe={false}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted dark:bg-gray-700 rounded-lg">
                  <p className="text-muted-foreground dark:text-gray-400">
                    Complete the parameter setup to generate the drill model
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <LoadingBar 
        isLoading={isGenerating} 
        duration={15000} 
        onComplete={() => setIsGenerating(false)}
      />
      
      <ExportLoadingIndicator 
        isExporting={isExporting}
        format={exportFormat}
        onComplete={() => setIsExporting(false)}
      />
    </div>
  );
};

export default DrillGenerator;
