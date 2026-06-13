import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface ToolOption {
  label: string;
  path: string;
  description: string;
}

const tools: ToolOption[] = [
  {
    label: 'Drill Generator',
    path: '/drill-generator',
    description: 'Design precision drills with customizable parameters'
  },
  {
    label: 'Endmill Generator',
    path: '/endmill-generator',
    description: 'Create custom endmill designs with precise parameters'
  },
  {
    label: 'Reamer Generator',
    path: '/reamer-generator',
    description: 'Design reamers with customizable specifications'
  },
  {
    label: 'Step Drill Generator',
    path: '/step-drill-generator',
    description: 'Generate step drill designs for multi-diameter holes'
  }
];

const ToolSelector = () => {
  const navigate = useNavigate();
  
  const handleSelectTool = (path: string) => {
    navigate(path);
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default">
          Design Tools <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {tools.map((tool) => (
          <DropdownMenuItem 
            key={tool.label}
            onClick={() => handleSelectTool(tool.path)}
            className="cursor-pointer"
          >
            <div className="flex flex-col space-y-1">
              <span className="font-medium">{tool.label}</span>
              <span className="text-xs text-muted-foreground">{tool.description}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ToolSelector;
