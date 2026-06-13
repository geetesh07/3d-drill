import React, { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

interface ExportLoadingIndicatorProps {
  isExporting: boolean;
  format: string;
  onComplete?: () => void;
}

const ExportLoadingIndicator: React.FC<ExportLoadingIndicatorProps> = ({ 
  isExporting, 
  format,
  onComplete
}) => {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState('');

  useEffect(() => {
    if (isExporting) {
      setIsVisible(true);
      setProgress(0);
      
      // Simulate progress with different steps
      const steps = [
        { name: 'Generating geometry', progress: 20 },
        { name: 'Creating views', progress: 40 },
        { name: 'Adding dimensions', progress: 60 },
        { name: 'Finalizing export', progress: 80 },
        { name: 'Preparing download', progress: 95 }
      ];
      
      let currentStepIndex = 0;
      
      const interval = setInterval(() => {
        if (currentStepIndex < steps.length) {
          setCurrentStep(steps[currentStepIndex].name);
          setProgress(steps[currentStepIndex].progress);
          currentStepIndex++;
        } else {
          clearInterval(interval);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    } else {
      // When export is complete, quickly fill to 100% and then hide
      setProgress(100);
      setCurrentStep('Export complete!');
      
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onComplete) onComplete();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isExporting, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center justify-center mb-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <h3 className="text-lg font-medium">Exporting {format.toUpperCase()}</h3>
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-muted-foreground mt-2 text-center">
          {currentStep}
        </p>
      </div>
    </div>
  );
};

export default ExportLoadingIndicator; 