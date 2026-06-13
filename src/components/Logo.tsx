import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/components/ThemeProvider';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  darkLogoPath?: string;
  lightLogoPath?: string;
  linkTo?: string;
}

export default function Logo({ 
  size = 'md', 
  darkLogoPath = '/logo-dark.svg',
  lightLogoPath = '/logo-light.svg',
  linkTo
}: LogoProps) {
  const { theme } = useTheme();
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16'
  };
  
  const content = (
    <div className="flex items-center">
      <img 
        src={theme === 'dark' ? darkLogoPath : lightLogoPath}
        alt="NTS Tool Solution PRO" 
        className={`${sizeClasses[size]} w-auto`} 
      />
      <div className="ml-2 flex flex-col">
        <span className="font-bold text-xl leading-tight tracking-tight">NTS</span>
        <span className="text-xs leading-tight text-muted-foreground">Tool Solution PRO</span>
      </div>
    </div>
  );
  
  return linkTo ? (
    <Link to={linkTo} className="flex items-center">
      {content}
    </Link>
  ) : content;
}
