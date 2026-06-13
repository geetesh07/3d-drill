import React, { Suspense, lazy } from "react";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import MainLayout from "./components/MainLayout";
import TermsPage from "./pages/TermsPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";
import UpdateUserRole from './pages/UpdateUserRole';
import AdminRoute from "./components/AdminRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import SetAdmin from './pages/SetAdmin';
import { BVHTest } from './components/BVHTest';
import { ProjectionExample } from './components/ProjectionExample';
import { EdgeProjectionDemo } from './components/projection/EdgeProjectionDemo';

// Lazy load the tool generators
const DrillGenerator = lazy(() => import("./pages/DrillGenerator"));

// Create a new QueryClient instance
const queryClient = new QueryClient();

// Loading component for suspense fallback
const Loading = () => (
  <div className="w-full h-screen flex items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      <p className="text-muted-foreground">Loading Drill Generator...</p>
    </div>
  </div>
);

// Preload function
const preloadDrillGenerator = () => {
  const component = import("./pages/DrillGenerator");
  return component;
};

// In Progress component
const InProgressTool = ({ toolName }: { toolName: string }) => (
  <div className="container py-12">
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">{toolName} - Coming Soon</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="animate-pulse rounded-full h-16 w-16 border-4 border-primary"></div>
          <p className="text-lg text-center">
            This feature is currently in development and will be available soon!
          </p>
          <p className="text-sm text-muted-foreground text-center">
            Please try our Drill Generator in the meantime.
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
);

const App = () => (
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <AuthProvider>
            <SettingsProvider>
              <SonnerToaster 
                position="top-center"
                duration={5000}
                closeButton
                theme="light"
                richColors
                expand={true}
                className="text-lg"
                toastOptions={{
                  style: {
                    fontSize: '1.1rem',
                    padding: '1.5rem',
                    minWidth: '400px',
                    maxWidth: '600px',
                    width: '100%',
                  }
                }}
              />
              <BrowserRouter>
                <Suspense fallback={<Loading />}>
                  <Routes>
                    <Route 
                      path="/" 
                      element={
                        <MainLayout>
                          <Home />
                        </MainLayout>
                      } 
                    />
                    <Route 
                      path="/login" 
                      element={
                        <MainLayout>
                          <Login />
                        </MainLayout>
                      } 
                    />
                    <Route 
                      path="/signup" 
                      element={
                        <MainLayout>
                          <Signup />
                        </MainLayout>
                      } 
                    />
                    <Route 
                      path="/terms" 
                      element={
                        <MainLayout>
                          <TermsPage />
                        </MainLayout>
                      } 
                    />
                    <Route 
                      path="/privacy" 
                      element={
                        <MainLayout>
                          <PrivacyPolicy />
                        </MainLayout>
                      } 
                    />
                    <Route
                      path="/drill-generator"
                      element={
                        <ProtectedRoute>
                          <MainLayout>
                            <Suspense fallback={<Loading />}>
                              <DrillGenerator />
                            </Suspense>
                          </MainLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/step-drill-generator"
                      element={
                        <ProtectedRoute>
                          <MainLayout>
                            <InProgressTool toolName="Step Drill Generator" />
                          </MainLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/reamer-generator"
                      element={
                        <ProtectedRoute>
                          <MainLayout>
                            <InProgressTool toolName="Reamer Generator" />
                          </MainLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/endmill-generator"
                      element={
                        <ProtectedRoute>
                          <MainLayout>
                            <InProgressTool toolName="Endmill Generator" />
                          </MainLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route 
                      path="/profile" 
                      element={
                        <ProtectedRoute>
                          <MainLayout>
                            <Profile />
                          </MainLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/settings" 
                      element={
                        <ProtectedRoute>
                          <MainLayout>
                            <Settings />
                          </MainLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin" 
                      element={
                        <ProtectedRoute>
                          <MainLayout>
                            <AdminDashboard />
                          </MainLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/update-roles" 
                      element={
                        <AdminRoute>
                          <MainLayout>
                            <UpdateUserRole />
                          </MainLayout>
                        </AdminRoute>
                      } 
                    />
                    <Route 
                      path="/set-admin" 
                      element={
                        <ProtectedRoute>
                          <MainLayout>
                            <SetAdmin />
                          </MainLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route
                      path="/bvh-test"
                      element={
                        <ProtectedRoute>
                          <BVHTest />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/projection-example"
                      element={
                        <ProtectedRoute>
                          <MainLayout>
                            <ProjectionExample />
                          </MainLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/projection-demo"
                      element={
                        <ProtectedRoute>
                          <MainLayout>
                            <EdgeProjectionDemo />
                          </MainLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </SettingsProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

export default App;
