import React from "react";
import { Toaster as SonnerToaster } from "sonner";
import { Toaster as HotToaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SettingsProvider } from "./context/SettingsContext";
import DrillGenerator from "./pages/DrillGenerator";

const App = () => (
  <ThemeProvider defaultTheme="light">
    <TooltipProvider>
      <SettingsProvider>
        <SonnerToaster
          position="top-center"
          duration={5000}
          closeButton
          richColors
        />
        <HotToaster position="bottom-center" />
        <DrillGenerator />
      </SettingsProvider>
    </TooltipProvider>
  </ThemeProvider>
);

export default App;
