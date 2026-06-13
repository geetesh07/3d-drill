import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Phone, Mail, Lock } from "lucide-react";
import { useRef, useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const hasShownNotification = useRef(false);

  useEffect(() => {
    // Reset the notification flag when the component unmounts
    return () => {
      hasShownNotification.current = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user && !hasShownNotification.current) {
    hasShownNotification.current = true;
    
    // Show enhanced message before redirecting
    toast(
      <Card className="w-[1200px] border-2 border-primary/20 shadow-xl bg-gradient-to-br from-background to-background/95 backdrop-blur-sm">
        <CardHeader className="pb-4 border-b border-primary/10">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-full bg-primary/10">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Premium Access Required
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 py-6">
          <div className="space-y-4">
            <p className="text-base text-muted-foreground leading-relaxed">
              This feature is exclusively available for registered users. 
              Please contact us to get access to our premium tools.
            </p>
          </div>
          <div className="space-y-3 border-t border-primary/10 pt-6">
            <a 
              href="tel:+919021075153" 
              className="flex items-center gap-4 text-base p-3 rounded-lg hover:bg-primary/5 transition-colors cursor-pointer group"
            >
              <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <span className="font-medium">+91 9021075153</span>
            </a>
            <a 
              href="mailto:geetesh@ntechnosolution.com" 
              className="flex items-center gap-4 text-base p-3 rounded-lg hover:bg-primary/5 transition-colors cursor-pointer group"
            >
              <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <span className="font-medium">geetesh@ntechnosolution.com</span>
            </a>
          </div>
        </CardContent>
      </Card>,
      {
        duration: 8000,
        position: "top-center",
        className: "bg-background/80 backdrop-blur-sm",
      }
    );
    
    // Redirect to login page but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
} 