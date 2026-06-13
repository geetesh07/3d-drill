import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import Logo from '@/components/Logo';
import { Drill, Scissors, Filter, FileStack, Wrench, ArrowRight, Factory, Settings, Award, UserPlus, ArrowRightCircle, LayoutGrid } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const toolTypes = [
    { 
      icon: <Drill className="h-8 w-8 text-blue-500" />, 
      title: 'Drills', 
      description: 'Design precision drill bits with custom flutes, angles and dimensions',
      path: '/drill-generator'
    },
    { 
      icon: <Scissors className="h-8 w-8 text-green-500" />, 
      title: 'Endmills', 
      description: 'Create endmills with multiple flutes, variable helix, and special geometries',
      path: '/endmill-generator'
    },
    { 
      icon: <Filter className="h-8 w-8 text-amber-500" />, 
      title: 'Reamers', 
      description: 'Design precise reamers with custom flutes and finishing capabilities',
      path: '/reamer-generator'
    },
    { 
      icon: <FileStack className="h-8 w-8 text-purple-500" />, 
      title: 'Step Drills', 
      description: 'Generate multi-diameter step drills with precise transitions',
      path: '/step-drill-generator'
    }
  ];

  const features = [
    {
      icon: <Settings className="h-6 w-6" />,
      title: 'Parametric Design',
      description: 'Create tools by setting dimensions and parameters with real-time preview'
    },
    {
      icon: <LayoutGrid className="h-6 w-6" />,
      title: '2D & 3D Visualization',
      description: 'View your designs in both 2D technical drawings and interactive 3D models'
    },
    {
      icon: <Factory className="h-6 w-6" />,
      title: 'Manufacturing Ready',
      description: 'Export designs in formats ready for CNC programming and manufacturing'
    },
    {
      icon: <Award className="h-6 w-6" />,
      title: 'Industry Standards',
      description: 'Apply industry standard tolerances and specifications to your tools'
    }
  ];

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/drill-generator');
    } else {
      navigate('/signup');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden bg-gradient-to-b from-background to-background/70">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.05]"></div>
        <div className="container px-4 mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2 space-y-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.5]">
                Design Precision Tools in <span className="text-primary">Minutes</span>, Not Days
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
                NTS Tool Solution PRO helps you create custom drills, endmills, reamers, and step drills with powerful parametric design tools.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Button size="lg" onClick={handleGetStarted}>
                  Start Designing <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="lg:w-1/2">
              <div className="p-6 rounded-lg border border-border bg-card/50 shadow-md">
                <h2 className="text-2xl font-bold mb-4">Professional Tool Design Software</h2>
                <p className="mb-4">Design precision cutting tools with our advanced parametric design platform. Our software offers:</p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <ArrowRightCircle className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
                    <span>Real-time 3D visualization and technical drawings</span>
                  </li>
                  <li className="flex items-start">
                    <ArrowRightCircle className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
                    <span>Manufacturing-ready exports in industry-standard formats</span>
                  </li>
                  <li className="flex items-start">
                    <ArrowRightCircle className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
                    <span>Comprehensive parameter control for precise specifications</span>
                  </li>
                  <li className="flex items-start">
                    <ArrowRightCircle className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
                    <span>Secure cloud storage for all your custom tool designs</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Tool Types Section */}
      <section className="py-16 bg-background/50">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Design Any Cutting Tool</h2>
            <p className="text-muted-foreground mt-2">Powerful parametric design for multiple tool types</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {toolTypes.map((tool, index) => (
              <Card key={index} className="border border-border/40 transition-all hover:shadow-md hover:border-primary/20 dark:bg-zinc-900/50">
                <CardHeader className="pb-2">
                  <div className="mb-2">{tool.icon}</div>
                  <CardTitle>{tool.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm min-h-[60px]">
                    {tool.description}
                  </CardDescription>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" size="sm" className="gap-1 text-primary" 
                    onClick={() => isAuthenticated ? navigate(tool.path) : navigate('/login')}>
                    Design Now <ArrowRightCircle className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Powerful Design Features</h2>
            <p className="text-muted-foreground mt-2">Everything you need to create professional cutting tools</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="p-6 rounded-lg border border-border/40 bg-background transition-all hover:shadow-md">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-medium mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="container px-4 mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Build Better Tools?</h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Start designing precision cutting tools with our easy-to-use parametric design platform.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" onClick={handleGetStarted}>
                Start Designing Now
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
