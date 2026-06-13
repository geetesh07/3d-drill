import React, { useCallback, useMemo, useRef, useState } from 'react';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Download, RefreshCw, Save, Check, X, Loader2, Wand2 } from 'lucide-react';
import { toast } from "sonner";
import { DrillParameters } from '../types/drill';
import { useSettings } from '@/context/SettingsContext';

interface ParameterInputProps {
  parameters: DrillParameters;
  onParameterChange: (key: keyof DrillParameters, value: any) => void;
  onReset: () => void;
  onExport: (format: 'step' | 'dxf') => void;
  onGenerateModel: () => void;
  isGenerating?: boolean;
  validateInput?: boolean;
}

const ParameterInput: React.FC<ParameterInputProps> = ({
  parameters,
  onParameterChange,
  onReset,
  onExport,
  onGenerateModel,
  isGenerating = false,
  validateInput = false
}) => {
  // State for tracking steps
  const [currentStep, setCurrentStep] = useState<'diameters' | 'lengths' | 'features'>('diameters');
  const [isModelGenerated, setIsModelGenerated] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  
  // Add validation state
  const [validationState, setValidationState] = useState({
    diameters: false,
    lengths: false,
    features: false
  });

  // Debounce timer ref
  const debounceTimer = useRef<NodeJS.Timeout>();
  
  const { showToasts } = useSettings();
  
  // Memoize calculateMinLength
  const calculateMinLength = useCallback((params: DrillParameters) => {
    // Calculate chamfer height
    const chamferHeight = Math.abs(params.diameter - params.shankDiameter) / 2;
    
    // Calculate total minimum length and round to nearest whole number
    // Overall length = flute length (includes tip) + shank length + chamfer length + 3mm buffer
    // Note: shank length starts after the fluted part
    return Math.round(params.fluteLength + params.shankLength + chamferHeight + 3);
  }, []);

  const calculateNonCuttingLength = useCallback((params: DrillParameters) => {
    // Calculate chamfer height
    const chamferHeight = Math.abs(params.diameter - params.shankDiameter) / 2;
    
    // Calculate total minimum length
    const minLength = Math.round(params.fluteLength + params.shankLength + chamferHeight + 3);
    
    // Calculate non-cutting length as the difference between total length and minimum length
    return Math.max(0, Math.round(params.length - minLength));
  }, []);

  // Memoize all calculations
  const minLength = useMemo(() => calculateMinLength(parameters), [
    parameters.shankLength,
    parameters.fluteLength,
    parameters.diameter,
    parameters.shankDiameter,
    parameters.tipAngle,
    parameters.length,
    calculateMinLength
  ]);

  // Update validation state when parameters change
  React.useEffect(() => {
    const newValidationState = {
      diameters: parameters.diameter > 0 && parameters.shankDiameter > 0,
      lengths: parameters.shankLength > 0 && parameters.fluteLength > 0,
      features: parameters.length >= minLength
    };

    // Only update if validation state has changed
    if (JSON.stringify(newValidationState) !== JSON.stringify(validationState)) {
      setValidationState(newValidationState);
    }
  }, [parameters, minLength, validationState]);

  // Handle tab change with validation
  const handleTabChange = (value: 'diameters' | 'lengths' | 'features') => {
    // Allow switching to any tab
    setCurrentStep(value);
  };

  // Debounced parameter change handler
  const debouncedParameterChange = useCallback((key: keyof DrillParameters, value: number | string) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      onParameterChange(key, value);
    }, 100);
  }, [onParameterChange]);

  const handleParameterChange = useCallback((key: keyof DrillParameters, value: number | string) => {
    // Handle empty string inputs
    if (typeof value === 'string' && value === '') {
      onParameterChange(key, 0);
      return;
    }

    // Handle string inputs that are numbers
    if (typeof value === 'string') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        handleParameterChange(key, numValue);
      }
      return;
    }

    // Handle number inputs
    if (typeof value === 'number') {
      // Prevent negative values
      if (value < 0) {
        onParameterChange(key, 0);
        return;
      }

      // Special handling for length-related parameters
      if (key === 'shankLength' || key === 'fluteLength' || key === 'diameter' || key === 'shankDiameter' || key === 'tipAngle') {
        const updatedParams = { ...parameters, [key]: value };
        const newMinLength = calculateMinLength(updatedParams);
        
        // Batch updates
        const updates: { key: keyof DrillParameters; value: number }[] = [];
        
        if (updatedParams.length < newMinLength) {
          updates.push(
            { key: 'length', value: newMinLength },
            { key: 'nonCuttingLength', value: 0 },
            { key, value }
          );
          
          if (showToasts) {
            toast.warning(`Adjusted overall length to minimum: ${newMinLength}mm`, {
              description: `Length was automatically adjusted due to changes in ${key}:\n` +
                `• New ${key}: ${value}mm\n` +
                `• New Minimum Length: ${newMinLength}mm\n` +
                `• Components:\n` +
                `  - Flute Length: ${updatedParams.fluteLength}mm\n` +
                `  - Shank Length: ${updatedParams.shankLength}mm\n` +
                (Math.abs(updatedParams.diameter - updatedParams.shankDiameter) > 0 
                  ? `  - Chamfer Height: ${Math.round(Math.abs(updatedParams.diameter - updatedParams.shankDiameter) / 2)}mm\n`
                  : '') +
                `  - Buffer: 3mm`,
              duration: 4000,
              position: 'top-center',
            });
          }
        } else {
          const newNonCuttingLength = calculateNonCuttingLength(updatedParams);
          updates.push(
            { key: 'nonCuttingLength', value: newNonCuttingLength },
            { key, value }
          );
        }
        
        // Apply updates immediately for length-related changes
        updates.forEach(update => onParameterChange(update.key, update.value));
      } else if (key === 'length') {
        // For overall length, allow any value during typing
        onParameterChange(key, value);
        
        // Only validate and adjust when the input is complete
        const newMinLength = calculateMinLength(parameters);
        
        if (value < newMinLength) {
          onParameterChange('length', newMinLength);
          onParameterChange('nonCuttingLength', 0);
          
          if (showToasts) {
            toast.error(`Length cannot be less than ${newMinLength}mm`, {
              description: `Minimum required length:\n` +
                `• Flute Length: ${parameters.fluteLength}mm\n` +
                `• Shank Length: ${parameters.shankLength}mm\n` +
                (Math.abs(parameters.diameter - parameters.shankDiameter) > 0 
                  ? `• Chamfer Height: ${Math.round(Math.abs(parameters.diameter - parameters.shankDiameter) / 2)}mm\n`
                  : '') +
                `• Buffer: 3mm\n` +
                `\nTotal Minimum: ${newMinLength}mm`,
              duration: 4000,
              position: 'top-center',
            });
          }
        } else {
          const newNonCuttingLength = calculateNonCuttingLength({ ...parameters, length: value });
          onParameterChange('nonCuttingLength', newNonCuttingLength);
        }
      } else {
        // For all other parameters, use debounced update
        debouncedParameterChange(key, value);
      }
    }
  }, [parameters, calculateMinLength, calculateNonCuttingLength, debouncedParameterChange, onParameterChange, showToasts]);

  const chamferHeight = useMemo(() => 
    Math.round(Math.abs(parameters.diameter - parameters.shankDiameter) / 2),
    [parameters.diameter, parameters.shankDiameter]
  );

  const nonCuttingLength = useMemo(() => 
    calculateNonCuttingLength(parameters),
    [parameters, calculateNonCuttingLength]
  );

  const tipHeight = useMemo(() => 
    Math.round(parameters.tipAngle === 180 ? 0 : (parameters.diameter / 2) / Math.tan((parameters.tipAngle / 2) * Math.PI / 180)),
    [parameters.diameter, parameters.tipAngle]
  );

  const handleInputChange = useCallback((key: keyof DrillParameters) => (e: React.ChangeEvent<HTMLInputElement>) => {
    handleParameterChange(key, e.target.value);
  }, [handleParameterChange]);

  const handleNextStep = () => {
    switch (currentStep) {
      case 'diameters':
        if (parameters.diameter > 0 && parameters.shankDiameter > 0) {
          setCurrentStep('lengths');
        } else if (showToasts) {
          toast.error('Please enter both drill and shank diameters');
        }
        break;
      case 'lengths':
        if (parameters.shankLength > 0 && parameters.fluteLength > 0) {
          setCurrentStep('features');
        } else if (showToasts) {
          toast.error('Please enter both shank and flute lengths');
        }
        break;
      case 'features':
        // Validate overall length before generating model
        if (parameters.length >= minLength) {
          setIsModelGenerated(true);
          onGenerateModel();
        } else if (showToasts) {
          toast.error(`Overall length must be at least ${minLength}mm`);
        }
        break;
    }
  };

  const handleBackStep = () => {
    switch (currentStep) {
      case 'lengths':
        setCurrentStep('diameters');
        break;
      case 'features':
        setCurrentStep('lengths');
        break;
    }
  };

  // Cleanup debounce timer on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <Card className="dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="dark:text-white">Drill Parameters</CardTitle>
        <CardDescription className="dark:text-gray-400">
          Configure your drill bit specifications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={currentStep} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="diameters" className="dark:data-[state=active]:bg-gray-700 dark:text-white">Diameters</TabsTrigger>
            <TabsTrigger value="lengths" className="dark:data-[state=active]:bg-gray-700 dark:text-white">Lengths</TabsTrigger>
            <TabsTrigger value="features" className="dark:data-[state=active]:bg-gray-700 dark:text-white">Features</TabsTrigger>
          </TabsList>
          
          <TabsContent value="diameters" className="space-y-4">
            {/* Diameter parameters */}
            <div className="p-3 bg-primary/5 rounded-md mb-2">
              <h3 className="text-sm font-medium mb-2">Diameter Parameters</h3>
              
              {/* Drill Diameter */}
              <div className="space-y-2 mb-3">
                <div className="flex justify-between items-center">
                  <Label htmlFor="diameter" className="text-sm font-medium">
                    Drill Diameter (mm)
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {parameters.diameter} mm
                  </span>
                </div>
                <Input
                  type="number"
                  min="0"
                  value={parameters.diameter}
                  onChange={handleInputChange('diameter')}
                  className="w-full text-right parameter-input"
                />
              </div>

              {/* Shank Diameter */}
              <div className="space-y-2 mb-3">
                <div className="flex justify-between items-center">
                  <Label htmlFor="shankDiameter" className="text-sm font-medium">
                    Shank Diameter (mm)
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {parameters.shankDiameter} mm
                  </span>
                </div>
                <Input
                  type="number"
                  min="0"
                  value={parameters.shankDiameter}
                  onChange={handleInputChange('shankDiameter')}
                  className="w-full text-right parameter-input"
                />
                {/* Chamfer Height Display */}
                {Math.abs(parameters.diameter - parameters.shankDiameter) > 0 && (
                  <div className="mt-2 p-2 bg-muted rounded-md">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium">Chamfer Height:</span>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(Math.abs(parameters.diameter - parameters.shankDiameter) / 2)} mm
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="lengths" className="space-y-4">
            {/* Length parameters */}
            <div className="p-3 bg-primary/5 rounded-md mb-2">
              <h3 className="text-sm font-medium mb-2">Length Parameters</h3>
              
              {/* Shank Length */}
              <div className="space-y-2 mb-3">
                <div className="flex justify-between items-center">
                  <Label htmlFor="shankLength" className="text-sm font-medium">
                    Shank Length (mm)
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {parameters.shankLength} mm
                  </span>
                </div>
                <Input
                  type="number"
                  min="0"
                  value={parameters.shankLength}
                  onChange={handleInputChange('shankLength')}
                  className="w-full text-right parameter-input"
                />
              </div>

              {/* Flute Length */}
              <div className="space-y-2 mb-3">
                <div className="flex justify-between items-center">
                  <Label htmlFor="fluteLength" className="text-sm font-medium">
                    Flute Length (mm)
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {parameters.fluteLength} mm
                  </span>
                </div>
                <Input
                  type="number"
                  min="0"
                  value={parameters.fluteLength}
                  onChange={handleInputChange('fluteLength')}
                  className="w-full text-right parameter-input"
                />
              </div>
              
              {/* Overall Length Input */}
              <div className="space-y-2 mb-3">
                <div className="flex justify-between items-center">
                  <Label htmlFor="overallLength" className="text-sm font-medium">
                    Overall Length (mm)
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {parameters.length} mm
                  </span>
                </div>
                <Input
                  type="number"
                  min="0"
                  value={parameters.length}
                  onChange={(e) => {
                    // Allow any value during typing, including empty string
                    const value = e.target.value;
                    if (value === '' || !isNaN(parseFloat(value))) {
                      // Just update the length parameter without validation
                      onParameterChange('length', value === '' ? 0 : parseFloat(value));
                    }
                  }}
                  onBlur={(e) => {
                    // Only calculate non-cutting length on blur
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                    if (!isNaN(value)) {
                      // Calculate non-cutting length
                      const newNonCuttingLength = Math.max(0, value - minLength);
                      onParameterChange('nonCuttingLength', newNonCuttingLength);
                    }
                  }}
                  className="w-full text-right parameter-input"
                />
                
                {/* Length Components Information */}
                <div className="mt-2 p-2 bg-muted rounded-md">
                  <div className="text-xs space-y-1">
                    <div className="font-medium">Length Components:</div>
                    <div className="flex justify-between">
                      <span>• Flute Length (including tip):</span>
                      <span>{parameters.fluteLength} mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Shank Length (after flute):</span>
                      <span>{parameters.shankLength} mm</span>
                    </div>
                    {Math.abs(parameters.diameter - parameters.shankDiameter) > 0 && (
                      <div className="flex justify-between">
                        <span>• Chamfer Height:</span>
                        <span>{chamferHeight} mm</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>• Buffer:</span>
                      <span>3 mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Non-cutting Length:</span>
                      <span>{nonCuttingLength} mm</span>
                    </div>
                    <div className="flex justify-between font-medium border-t border-border/40 mt-1 pt-1">
                      <span>Total Length:</span>
                      <span>{parameters.length} mm</span>
                    </div>
                    <div className="flex justify-between text-primary border-t border-border/40 mt-1 pt-1">
                      <span>Minimum Required Length:</span>
                      <span>{minLength} mm</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            {/* Features parameters */}
            <div className="p-3 bg-primary/5 rounded-md mb-2">
              <h3 className="text-sm font-medium mb-2">Feature Parameters</h3>
              
              {/* Flute Count */}
              <div className="space-y-2 mb-3">
                <Label htmlFor="fluteCount" className="text-sm font-medium">
                  Number of Flutes
                </Label>
                <Select
                  value={parameters.fluteCount.toString()}
                  onValueChange={(value) => onParameterChange('fluteCount', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select number of flutes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">Two Flutes</SelectItem>
                    <SelectItem value="3">Three Flutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tip Angle */}
              <div className="space-y-2 mb-3">
                <div className="flex justify-between items-center">
                  <Label htmlFor="tipAngle" className="text-sm font-medium">
                    Tip Angle (degrees)
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {parameters.tipAngle}°
                  </span>
                </div>
                <Input
                  type="number"
                  min={60}
                  max={180}
                  value={parameters.tipAngle}
                  onChange={handleInputChange('tipAngle')}
                  className="w-full text-right parameter-input"
                />
              </div>

              {/* Helix Angle */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="helixAngle" className="text-sm font-medium">
                    Helix Angle (degrees)
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {parameters.helixAngle}°
                  </span>
                </div>
                <Input
                  type="number"
                  min={0}
                  max={60}
                  value={parameters.helixAngle}
                  onChange={handleInputChange('helixAngle')}
                  className="w-full text-right parameter-input"
                />
              </div>
            </div>
            
            <div className="p-3 bg-primary/5 rounded-md">
              <h4 className="text-sm font-medium mb-2">Technical Notes</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• <span className="font-medium">Two Flutes:</span> Standard, general purpose drilling</li>
                <li>• <span className="font-medium">Three Flutes:</span> Better finish, for harder materials</li>
                <li>• Larger helix angles provide better chip evacuation</li>
                <li>• Standard tip angle is 118° for general purpose drilling</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <Separator />
      <CardFooter className="flex flex-wrap gap-2 justify-between">
        <Button
          variant="outline"
          onClick={onReset}
          className="dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
          disabled={isGenerating}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => onExport('dxf')}
            className="dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
            disabled={isGenerating}
          >
            <Download className="mr-2 h-4 w-4" />
            DXF
          </Button>
          <Button
            variant="outline"
            onClick={() => onExport('step')}
            className="dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
            disabled={isGenerating}
          >
            <Download className="mr-2 h-4 w-4" />
            STEP
          </Button>
          <Button
            onClick={onGenerateModel}
            className="dark:bg-blue-600 dark:hover:bg-blue-700"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ParameterInput;
