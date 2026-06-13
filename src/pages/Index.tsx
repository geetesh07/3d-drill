import React, { useState } from 'react';
import { DrillViewer } from '@/components/DrillViewer';
import ParameterInput from '@/components/ParameterInput';
import ExportDialog from '@/components/ExportDialog';
import { Button } from '@/components/ui/button';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { exportDrillModel } from '@/lib/exportUtils';
import { DrillParameters } from '@/types/drill';
import { 
  Box, 
  Grid2X2, 
  Info, 
  FileDown, 
  Settings2, 
  RefreshCw, 
  Layers3,
  Home,
  Wrench,
  X,
  Scissors,
  Filter,
  FileStack
} from 'lucide-react';
import { toast } from "sonner";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Link } from 'react-router-dom';

const Index = () => {
  // State for drill parameters
  const [parameters, setParameters] = useState<DrillParameters>({
    diameter: 10,
    length: 85.5, // Initial length is sum of default components
    shankDiameter: 10,
    shankLength: 40,
    fluteCount: 2,
    fluteLength: 45,
    nonCuttingLength: 0,
    tipAngle: 118,
    helixAngle: 30,
    tolerance: 'h8',
    material: 'hss',
    surfaceFinish: 'polished'
  });

  // State for view mode
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [wireframe, setWireframe] = useState(false);
  
  // State for export dialog
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  // State for active section
  const [activeSection, setActiveSection] = useState('designer');

  // Handle parameter reset
  const handleReset = () => {
    setParameters({
      diameter: 10,
      length: 85.5, // Reset to initial sum
      shankDiameter: 10,
      shankLength: 40,
      fluteCount: 2,
      fluteLength: 45,
      nonCuttingLength: 0,
      tipAngle: 118,
      helixAngle: 30,
      tolerance: 'h8',
      material: 'hss',
      surfaceFinish: 'polished'
    });
    
    toast.success("Parameters reset to default values");
  };

  // Handle export
  const handleExport = () => {
    setIsExportDialogOpen(true);
  };

  // Handle actual export after dialog confirmation
  const handleExportConfirm = async (format: string, filename: string) => {
    try {
      console.log(`Starting export process for ${format} format...`);
      await exportDrillModel(parameters, format, filename);
      console.log(`Successfully exported ${format} file`);
      toast.success(`Successfully exported ${format.toUpperCase()} file`);
    } catch (error) {
      console.error(`Export failed for ${format}:`, error);
      toast.error(`Failed to export ${format.toUpperCase()}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="w-full py-3 px-6 border-b border-border/40 flex items-center justify-between bg-card/30">
        <div className="flex items-center gap-2">
          <Wrench className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-light tracking-tight">Drill Designer Pro</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setActiveSection('home')}>
            <Home size={16} className="mr-1" />
            Home
          </Button>
          <Button variant="outline" size="sm" onClick={() => setActiveSection('designer')}>
            <Wrench size={16} className="mr-1" />
            Designer
          </Button>
          <Button variant="outline" size="sm" onClick={() => setActiveSection('settings')}>
            <Settings2 size={16} className="mr-1" />
            Settings
          </Button>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Home section */}
        {activeSection === 'home' && (
          <div className="p-6 max-w-screen-xl mx-auto w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tight">
                  Design Precision Drill Bits with Ease
                </h1>
                <p className="text-lg text-muted-foreground">
                  Create and customize drill bits with our parametric design tool. 
                  Export to various formats for manufacturing or integration into your projects.
                </p>
                <div className="flex gap-4">
                  <Button size="lg" onClick={() => setActiveSection('designer')} className="gap-2">
                    <Wrench size={18} />
                    Start Designing
                  </Button>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 rounded-xl p-6 shadow-lg border border-border/40 h-80 flex items-center justify-center">
                <DrillViewer parameters={parameters} viewMode="3d" />
              </div>
              
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Layers3 className="h-5 w-5 text-primary" />
                      Parametric Design
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Create custom drill bits by adjusting all critical parameters including dimensions, flute count, helix angle, and more.</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileDown className="h-5 w-5 text-primary" />
                      Multiple Export Formats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Export your designs in STL, DWG, STEP, or PDF formats for manufacturing, documentation, or further design work.</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Grid2X2 className="h-5 w-5 text-primary" />
                      2D & 3D Visualization
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>View your designs in both 2D technical drawing view and interactive 3D model with proper dimensions and tolerances.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
        
        {/* Designer section */}
        {activeSection === 'designer' && (
          <main className="flex-1 p-4 flex flex-col lg:flex-row gap-4 max-w-screen-2xl mx-auto w-full">
            {/* Left panel - Parameters */}
            <div className="w-full lg:w-[300px] flex flex-col gap-4">
              <ParameterInput 
                parameters={parameters}
                onParameterChange={(key, value) => {
                  setParameters(prev => ({
                    ...prev,
                    [key]: value
                  }));
                }}
                onExport={handleExport}
                onReset={handleReset}
                onGenerateModel={() => {}}
              />
              
              <div className="p-3 rounded-lg mt-auto border border-border/40 bg-card/20">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-medium">Project Info</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Parametric drill designer with export capabilities. 
                  Adjust parameters and view real-time changes in 3D or 2D.
                </p>
              </div>
            </div>

            {/* Right panel - Visualization */}
            <div className="flex-1 rounded-xl border border-border/40 overflow-hidden flex flex-col bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900/50 dark:to-blue-900/30">
              <div className="border-b border-border/40 p-3 flex items-center justify-between bg-card/20">
                <h2 className="text-lg font-medium">
                  Drill Preview
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWireframe(!wireframe)}
                    className={`gap-1 ${wireframe ? 'bg-primary/10' : ''}`}
                  >
                    <Layers3 className="w-3.5 h-3.5" />
                    <span>Wireframe</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    className="gap-1"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Export</span>
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 min-h-[70vh]">
                <DrillViewer
                  parameters={parameters}
                  viewMode={viewMode}
                  wireframe={wireframe}
                />
              </div>
            </div>
          </main>
        )}

        {/* Settings Content */}
        {activeSection === 'settings' && (
          <div className="p-6 max-w-screen-xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Application Settings</CardTitle>
                <CardDescription>
                  Configure application behavior and defaults
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Settings functionality will be available in future updates. This will include:
                </p>
                <ul className="list-disc pl-5 mt-4 space-y-2 text-sm text-muted-foreground">
                  <li>Default parameter presets</li>
                  <li>Unit system selection (metric/imperial)</li>
                  <li>Custom material definitions</li>
                  <li>Export format preferences</li>
                  <li>Visualization options</li>
                  <li>Cloud syncing preferences</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Export dialog */}
      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        parameters={parameters}
        onExport={handleExportConfirm}
      />
    </div>
  );
};

export default Index;
