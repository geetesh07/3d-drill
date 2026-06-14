import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster as SonnerToaster } from "sonner";
import { Toaster as HotToaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SettingsProvider } from "./context/SettingsContext";
import { AuthProvider } from "./context/AuthContext";
import { SiteLayout } from "./components/site/SiteLayout";
import { AppLayout } from "./components/site/AppLayout";
import { SpinnerGap } from "@phosphor-icons/react";

import Landing from "./pages/Landing";
import Pricing from "./pages/Pricing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";

// The designer pulls in Three.js + the OCC seam — lazy-load it off the marketing path.
const DrillGenerator = lazy(() => import("./pages/DrillGenerator"));

const PageLoader = () => (
  <div className="flex min-h-[60dvh] items-center justify-center">
    <SpinnerGap size={28} className="animate-spin text-primary" />
  </div>
);

const App = () => (
  <ThemeProvider defaultTheme="dark">
    <TooltipProvider delayDuration={150}>
      <AuthProvider>
        <SettingsProvider>
          <SonnerToaster position="top-center" duration={5000} closeButton theme="dark" richColors />
          <HotToaster position="bottom-center" />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route element={<SiteLayout />}>
                  <Route path="/" element={<Landing />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="*" element={<NotFound />} />
                </Route>

                <Route element={<AppLayout />}>
                  <Route path="/app" element={<DrillGenerator />} />
                </Route>

                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </SettingsProvider>
      </AuthProvider>
    </TooltipProvider>
  </ThemeProvider>
);

export default App;
