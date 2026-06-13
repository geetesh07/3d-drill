import React, { useCallback, useRef, useState } from "react";
import * as THREE from "three";
import { DrillViewer } from "@/components/DrillViewer";
import { Card, CardContent } from "@/components/ui/card";
import ParameterInput from "@/components/ParameterInput";
import { DrillParameters } from "@/types/drill";
import { toast } from "sonner";
import { buildDrillSolid, shapeToBufferGeometry, shapeToStep } from "@/lib/occDrill";
import { exportDrillDxf } from "@/lib/occDxf";
import { useSettings } from "@/context/SettingsContext";
import { Loader2 } from "lucide-react";

const DEFAULT_PARAMETERS: DrillParameters = {
  diameter: 10,
  length: 100,
  shankDiameter: 10,
  shankLength: 30,
  fluteCount: 2,
  fluteLength: 60,
  nonCuttingLength: 10,
  tipAngle: 118,
  helixAngle: 30,
  material: "hss",
  surfaceFinish: "polished",
};

function downloadText(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const errMessage = (e: unknown) => (e && (e as { message?: string }).message) || String(e);

const DrillGenerator = () => {
  const { showToasts } = useSettings();
  const [parameters, setParameters] = useState<DrillParameters>(DEFAULT_PARAMETERS);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState("");
  const fileBase = useRef("drill");

  const handleParameterChange = useCallback((key: keyof DrillParameters, value: unknown) => {
    setParameters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleReset = useCallback(() => {
    setParameters(DEFAULT_PARAMETERS);
    setGeometry(null);
  }, []);

  const handleGenerate = useCallback(async () => {
    setIsBusy(true);
    setStatus("Loading CAD engine & building solid…");
    try {
      const { oc, shape, metrics } = await buildDrillSolid(parameters);
      const geom = shapeToBufferGeometry(oc, shape);
      fileBase.current = `Drill_${parameters.diameter}x${parameters.length}_${parameters.fluteCount}F`;
      setGeometry(geom);
      console.log("[drill] generated", metrics);
      if (showToasts) toast.success("Drill model generated");
    } catch (e) {
      console.error("Generate failed:", e);
      if (showToasts) toast.error("Failed to generate model", { description: errMessage(e) });
    } finally {
      setIsBusy(false);
      setStatus("");
    }
  }, [parameters, showToasts]);

  const handleExport = useCallback(
    async (format: "step" | "dxf") => {
      setIsBusy(true);
      setStatus(`Exporting ${format.toUpperCase()}…`);
      try {
        const { oc, shape } = await buildDrillSolid(parameters);
        const base = `Drill_${parameters.diameter}x${parameters.length}_${parameters.fluteCount}F`;
        if (format === "step") {
          const step = shapeToStep(oc, shape);
          downloadText(`${base}.step`, step, "application/step");
          if (showToasts) toast.success("STEP exported");
        } else {
          const dxf = exportDrillDxf(oc, shape, parameters);
          downloadText(`${base}.dxf`, dxf, "application/dxf");
          if (showToasts) toast.success("DXF (2D drawing) exported");
        }
      } catch (e) {
        console.error("Export failed:", e);
        if (showToasts) toast.error("Export failed", { description: errMessage(e) });
      } finally {
        setIsBusy(false);
        setStatus("");
      }
    },
    [parameters, showToasts]
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-1">
        <h1 className="text-3xl font-bold">Drill Designer</h1>
        <p className="text-muted-foreground">
          Parametric twist-drill modeling on a real CAD kernel (OpenCASCADE) — exact solids, real STEP.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[400px_1fr] gap-6">
        <ParameterInput
          parameters={parameters}
          onParameterChange={handleParameterChange}
          onReset={handleReset}
          onExport={handleExport}
          onGenerateModel={handleGenerate}
          isGenerating={isBusy}
        />

        <Card className="dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="aspect-video relative">
              {geometry ? (
                <DrillViewer geometry={geometry} surfaceFinish={parameters.surfaceFinish} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted dark:bg-gray-700 rounded-lg">
                  <p className="text-muted-foreground text-center px-6">
                    Set your parameters and press <span className="font-medium">Generate</span> to build the 3D model.
                  </p>
                </div>
              )}

              {isBusy && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                  <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-md shadow">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-sm">{status || "Working…"}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DrillGenerator;
