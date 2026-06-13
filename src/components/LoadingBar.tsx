import React, { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

interface LoadingBarProps {
  isLoading: boolean;
  onComplete?: () => void;
  duration?: number; // Duration in milliseconds
}

const LoadingBar: React.FC<LoadingBarProps> = ({ 
  isLoading, 
  onComplete, 
  duration = 15000 // Increased default duration to 30 seconds
}) => {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState("Great things take time!");

  useEffect(() => {
    if (isLoading) {
      setIsVisible(true);
      setProgress(0);
      setMessage("Great things take time!");
      
      // Create a progress animation that takes the specified duration
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        const newProgress = Math.min(95, (elapsedTime / duration) * 100);
        setProgress(newProgress);
        
        // Update message based on progress
        if (elapsedTime > duration) {
          setMessage("Still working on it... This might take a bit longer.");
        } else if (elapsedTime > duration * 0.7) {
          setMessage("Almost there! Finishing up the details...");
        } else if (elapsedTime > duration * 0.4) {
          setMessage("Making good progress! Generating complex geometry...");
        }
        
        // If we've reached the end of the duration, stop the interval
        if (elapsedTime >= duration) {
          clearInterval(interval);
          setProgress(95); // Keep at 95% until complete
        }
      }, 100);
      
      return () => clearInterval(interval);
    } else {
      // When loading is complete, quickly fill to 100% and then hide
      setProgress(100);
      setMessage("Generation complete!");
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onComplete) onComplete();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center justify-center mb-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <h3 className="text-lg font-medium">Generating Drill Model</h3>
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-muted-foreground mt-2 text-center">
          {message}
        </p>
      </div>
    </div>
  );
};

export default LoadingBar; 