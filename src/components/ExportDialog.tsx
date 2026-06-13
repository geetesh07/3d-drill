
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FileDown, RefreshCw, HelpCircle, Database } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { DrillParameters } from '@/types/drill';
import { generateAutoCADInstructions } from '@/lib/specGenerator';
import { toast } from "sonner";

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  parameters: DrillParameters;
  onExport: (format: string, filename: string) => void;
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  parameters,
  onExport,
}) => {
  const [filename, setFilename] = useState(`Drill_${parameters.diameter}x${parameters.length}_${parameters.fluteCount}F`);
  const [format, setFormat] = useState('step');
  const [isExporting, setIsExporting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      console.log(`Starting ${format.toUpperCase()} export process...`);
      await onExport(format, filename);
      console.log('Export completed successfully');
      onClose();
    } catch (error) {
      console.error(`${format.toUpperCase()} export failed:`, error);
      toast.error(`Failed to export ${format.toUpperCase()}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass sm:max-w-md animate-slide-up">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light tracking-tight">Export Drawing</DialogTitle>
          <DialogDescription>
            Configure export settings for your drill drawing
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="filename" className="text-sm font-medium">
              Filename
            </Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="parameter-input"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="format" className="text-sm font-medium">
              Export Format
            </Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dwg">
                  <Tooltip>
                    <TooltipTrigger className="flex w-full">AutoCAD DWG</TooltipTrigger>
                    <TooltipContent>
                      <p>Native AutoCAD format with full editing capability</p>
                    </TooltipContent>
                  </Tooltip>
                </SelectItem>
                <SelectItem value="dxf">
                  <Tooltip>
                    <TooltipTrigger className="flex w-full">DXF</TooltipTrigger>
                    <TooltipContent>
                      <p>Drawing Exchange Format, compatible with most CAD software</p>
                    </TooltipContent>
                  </Tooltip>
                </SelectItem>
                <SelectItem value="step">
                  <Tooltip>
                    <TooltipTrigger className="flex w-full">STEP (3D Model)</TooltipTrigger>
                    <TooltipContent>
                      <p>Standard for Exchange of Product Data, high precision 3D format</p>
                    </TooltipContent>
                  </Tooltip>
                </SelectItem>
                <SelectItem value="stl">
                  <Tooltip>
                    <TooltipTrigger className="flex w-full">STL (3D Model)</TooltipTrigger>
                    <TooltipContent>
                      <p>3D model format for 3D printing and visualization</p>
                    </TooltipContent>
                  </Tooltip>
                </SelectItem>
                <SelectItem value="jscad">
                  <Tooltip>
                    <TooltipTrigger className="flex w-full">JSCAD (Parametric 2D)</TooltipTrigger>
                    <TooltipContent>
                      <p>Parametric JavaScript model that needs conversion for AutoCAD</p>
                    </TooltipContent>
                  </Tooltip>
                </SelectItem>
                <SelectItem value="pdf">
                  <Tooltip>
                    <TooltipTrigger className="flex w-full">PDF (Technical Drawing)</TooltipTrigger>
                    <TooltipContent>
                      <p>Technical drawing with dimensions in PDF format for sharing</p>
                    </TooltipContent>
                  </Tooltip>
                </SelectItem>
                <SelectItem value="json">
                  <Tooltip>
                    <TooltipTrigger className="flex w-full">
                      <Database className="mr-2 h-4 w-4" /> 
                      JSON (Geometric Data)
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>All geometric parameters in JSON format for data processing</p>
                    </TooltipContent>
                  </Tooltip>
                </SelectItem>
                <SelectItem value="csv">
                  <Tooltip>
                    <TooltipTrigger className="flex w-full">
                      <Database className="mr-2 h-4 w-4" /> 
                      CSV (Geometric Data)
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>All geometric parameters in CSV format for spreadsheets</p>
                    </TooltipContent>
                  </Tooltip>
                </SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex justify-end mt-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 gap-1 text-xs text-muted-foreground"
                onClick={() => setShowInstructions(!showInstructions)}
              >
                <HelpCircle size={12} />
                {showInstructions ? "Hide instructions" : "How to use this format"}
              </Button>
            </div>
          </div>
          
          {showInstructions && (
            <div className="bg-muted/30 p-3 rounded-md text-xs space-y-2 border border-border/40">
              <h4 className="font-medium">Usage Instructions</h4>
              <div className="text-muted-foreground space-y-1 whitespace-pre-line">
                {format === 'jscad' ? (
                  <>
                    <p><b>JSCAD files are JavaScript parametric models:</b></p>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Upload to <a href="https://openjscad.xyz" target="_blank" rel="noopener" className="text-primary underline">OpenJSCAD.org</a></li>
                      <li>Click "Generate" to render the model</li>
                      <li>Export as DXF from the website</li>
                      <li>Open the exported DXF in AutoCAD</li>
                    </ol>
                  </>
                ) : format === 'dwg' || format === 'dxf' ? (
                  <>
                    <p><b>For AutoCAD DWG/DXF:</b></p>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Open AutoCAD</li>
                      <li>Go to File &gt; Open</li>
                      <li>Select the downloaded file</li>
                      <li>The drawing will open with all dimensions</li>
                    </ol>
                  </>
                ) : format === 'stl' ? (
                  <>
                    <p><b>STL 3D model:</b></p>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Use with 3D printing software</li>
                      <li>View in any 3D model viewer</li>
                      <li>Cannot be directly edited in AutoCAD</li>
                    </ol>
                  </>
                ) : format === 'step' ? (
                  <>
                    <p><b>STEP 3D model:</b></p>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Open with CAD software like AutoCAD, Fusion 360, SolidWorks, etc.</li>
                      <li>Contains full 3D geometry with parametric information</li>
                      <li>Preserves all design features</li>
                      <li>Industry-standard format for CAD/CAM systems</li>
                      <li>Suitable for manufacturing and CNC machining</li>
                    </ol>
                  </>
                ) : format === 'json' || format === 'csv' ? (
                  <>
                    <p><b>Geometric Data Export:</b></p>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Contains all design parameters in structured format</li>
                      <li>Use for data analysis or custom processing</li>
                      <li>Can be imported into spreadsheets or databases</li>
                      <li>Useful for CNC programming or inventory systems</li>
                    </ol>
                  </>
                ) : (
                  <>
                    <p><b>PDF Technical Drawing:</b></p>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Open with any PDF viewer</li>
                      <li>Contains all dimensions and specifications</li>
                      <li>For reference, not directly editable</li>
                    </ol>
                  </>
                )}
              </div>
            </div>
          )}
          
          <div className="bg-muted/50 p-3 rounded-md text-sm space-y-2">
            <h4 className="font-medium">Export Summary</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li className="flex justify-between">
                <span>Diameter:</span>
                <span>{parameters.diameter} mm {parameters.tolerance}</span>
              </li>
              <li className="flex justify-between">
                <span>Total Length:</span>
                <span>{parameters.length} mm</span>
              </li>
              <li className="flex justify-between">
                <span>Shank Length:</span>
                <span>{parameters.shankLength} mm</span>
              </li>
              <li className="flex justify-between">
                <span>Flute Length:</span>
                <span>{parameters.fluteLength} mm</span>
              </li>
              <li className="flex justify-between">
                <span>Cutting Length:</span>
                <span>{parameters.fluteLength - parameters.nonCuttingLength} mm</span>
              </li>
              <li className="flex justify-between">
                <span>Flutes:</span>
                <span>{parameters.fluteCount}</span>
              </li>
              <li className="flex justify-between">
                <span>Material:</span>
                <span>{parameters.material.toUpperCase()}</span>
              </li>
            </ul>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting}
            className="gap-1 btn-primary"
          >
            {isExporting ? (
              <>
                <span className="animate-spin">
                  <RefreshCw size={14} />
                </span>
                Exporting...
              </>
            ) : (
              <>
                <FileDown size={14} />
                Export as {format.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
