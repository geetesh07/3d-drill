import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Logo from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { Menu, X, User, LogOut, Wrench, Home, Settings2, Scissors, Filter, FileStack } from 'lucide-react';
import ToolSelector from './ToolSelector';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

// Preload function
const preloadDrillGenerator = () => {
  const component = import("../pages/DrillGenerator");
  return component;
};

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        // Check if user has admin role in metadata
        const isUserAdmin = user.user_metadata?.role === 'admin';
        setIsAdmin(isUserAdmin);
      }
    };

    checkAdminStatus();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Check if we're on login or signup page
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <div className="min-h-screen flex flex-col">
      {!isAuthPage && (
        <>
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
              <div className="mr-4 flex">
                <div className="mr-6 flex items-center space-x-2">
                  <Logo size="sm" linkTo="/" />
                </div>
              </div>
              <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                <div className="w-full flex-1 md:w-auto md:flex-none">
                  {/* Add search or other controls here if needed */}
                </div>
                <nav className="flex items-center space-x-6 text-sm font-medium">
                  <Link
                    to="/"
                    className={`transition-colors hover:text-foreground/80 ${
                      location.pathname === '/' ? 'text-foreground' : 'text-foreground/60'
                    }`}
                  >
                    Home
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="text-sm font-medium">
                        <Wrench className="mr-2 h-4 w-4" />
                        Generator
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="center">
                      <DropdownMenuItem asChild>
                        <Link 
                          to="/drill-generator" 
                          onMouseEnter={preloadDrillGenerator}
                        >
                          Drill Generator
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/reamer-generator">Reamer Generator</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/endmill-generator">Endmill Generator</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/step-drill-generator">Step Drill Generator</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/projection-demo">
                          <FileStack className="mr-2 h-4 w-4" />
                          Edge Projection Demo
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Link
                    to="/terms"
                    className={`transition-colors hover:text-foreground/80 ${
                      location.pathname === '/terms' ? 'text-foreground' : 'text-foreground/60'
                    }`}
                  >
                    Terms
                  </Link>
                  <Link
                    to="/privacy"
                    className={`transition-colors hover:text-foreground/80 ${
                      location.pathname === '/privacy' ? 'text-foreground' : 'text-foreground/60'
                    }`}
                  >
                    Privacy
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className={`transition-colors hover:text-foreground/80 ${
                        location.pathname === '/admin' ? 'text-foreground' : 'text-foreground/60'
                      }`}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <div className="flex items-center space-x-4">
                    <ThemeToggle />
                    {isAuthenticated ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                            <User className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                          <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                              <p className="text-sm font-medium leading-none">{user?.user_metadata?.full_name}</p>
                              <p className="text-xs leading-none text-muted-foreground">
                                {user?.email}
                              </p>
                            </div>
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link to="/profile">Profile</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/settings">Settings</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <>
                        <Link to="/login">
                          <Button variant="ghost">Sign In</Button>
                        </Link>
                        <Link to="/signup">
                          <Button variant="default">Get Started</Button>
                        </Link>
                      </>
                    )}
                  </div>
                </nav>
                <Button
                  variant="ghost"
                  className="md:hidden"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </header>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden bg-background border-t border-border/40 py-4">
              <div className="container mx-auto px-4 space-y-3">
                <Link 
                  to="/" 
                  className={`block text-sm font-medium hover:text-primary py-2 ${location.pathname === '/' ? 'text-primary font-semibold' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground py-2">Generator</div>
                  <Link 
                    to="/drill-generator" 
                    className={`block text-sm font-medium hover:text-primary py-2 pl-4 ${location.pathname === '/drill-generator' ? 'text-primary font-semibold' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    onMouseEnter={preloadDrillGenerator}
                  >
                    Drill Generator
                  </Link>
                  <Link 
                    to="/reamer-generator" 
                    className={`block text-sm font-medium hover:text-primary py-2 pl-4 ${location.pathname === '/reamer-generator' ? 'text-primary font-semibold' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Reamer Generator
                  </Link>
                  <Link 
                    to="/endmill-generator" 
                    className={`block text-sm font-medium hover:text-primary py-2 pl-4 ${location.pathname === '/endmill-generator' ? 'text-primary font-semibold' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Endmill Generator
                  </Link>
                  <Link 
                    to="/step-drill-generator" 
                    className={`block text-sm font-medium hover:text-primary py-2 pl-4 ${location.pathname === '/step-drill-generator' ? 'text-primary font-semibold' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Step Drill Generator
                  </Link>
                  <div className="border-t border-border/40 my-2"></div>
                  <Link 
                    to="/projection-demo" 
                    className={`block text-sm font-medium hover:text-primary py-2 pl-4 ${location.pathname === '/projection-demo' ? 'text-primary font-semibold' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Edge Projection Demo
                  </Link>
                </div>
                <Link 
                  to="/terms" 
                  className={`block text-sm font-medium hover:text-primary py-2 ${location.pathname === '/terms' ? 'text-primary font-semibold' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Terms
                </Link>
                <Link 
                  to="/privacy" 
                  className={`block text-sm font-medium hover:text-primary py-2 ${location.pathname === '/privacy' ? 'text-primary font-semibold' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Privacy
                </Link>
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className={`block text-sm font-medium hover:text-primary py-2 ${location.pathname === '/admin' ? 'text-primary font-semibold' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Admin Dashboard
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
