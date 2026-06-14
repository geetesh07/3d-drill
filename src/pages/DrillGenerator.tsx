import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { DrillViewer, type ViewMode } from "@/components/DrillViewer";
import { DrawingView } from "@/components/DrawingView";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ParameterInput from "@/components/ParameterInput";
import { DrillParameters } from "@/types/drill";
import { toast } from "sonner";
import { buildDrillSolid, shapeToBufferGeometry, shapeToEdges, shapeToStep } from "@/lib/occDrill";
import { exportDrillDxf } from "@/lib/occDxf";
import { projectEdges } from "@/lib/occProjection";
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
  const [edges, setEdges] = useState<THREE.BufferGeometry | null>(null);
  const [mode, setMode] = useState<ViewMode>("shaded");
  const [projVisible, setProjVisible] = useState<THREE.BufferGeometry | null>(null);
  const [projHidden, setProjHidden] = useState<THREE.BufferGeometry | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState("");
  const meshRef = useRef<THREE.BufferGeometry | null>(null);

  const handleParameterChange = useCallback((key: keyof DrillParameters, value: unknown) => {
    setParameters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleReset = useCallback(() => {
    setParameters(DEFAULT_PARAMETERS);
    setGeometry(null);
    setEdges(null);
    setProjVisible(null);
    setProjHidden(null);
    meshRef.current = null;
  }, []);

  const handleGenerate = useCallback(async () => {
    setIsBusy(true);
    setStatus("Loading CAD engine & building solid…");
    try {
      const { oc, shape, metrics } = await buildDrillSolid(parameters);
      const meshGeom = shapeToBufferGeometry(oc, shape);
      meshRef.current = meshGeom;
      setGeometry(meshGeom);
      setEdges(shapeToEdges(oc, shape));
      // Invalidate the cached 2D projection — it'll be recomputed when viewed.
      setProjVisible(null);
      setProjHidden(null);
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
          downloadText(`${base}.step`, shapeToStep(oc, shape), "application/step");
          if (showToasts) toast.success("STEP exported");
        } else {
          const dxf = await exportDrillDxf(oc, shape, parameters, (m) => setStatus(m));
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

  // Compute the 2D projection lazily, only when the drawing view is opened.
  useEffect(() => {
    if (mode !== "drawing" || projVisible || !meshRef.current) return;
    let cancelled = false;
    (async () => {
      setIsBusy(true);
      setStatus("Projecting 2D drawing…");
      try {
        const view = await projectEdges(meshRef.current!, new THREE.Euler(0, Math.PI / 2, 0));
        if (!cancelled) {
          setProjVisible(view.visible);
          setProjHidden(view.hidden);
        }
      } catch (e) {
        console.error("Projection failed:", e);
        if (!cancelled && showToasts) toast.error("Failed to build 2D drawing", { description: errMessage(e) });
      } finally {
        if (!cancelled) {
          setIsBusy(false);
          setStatus("");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, projVisible, showToasts]);

  const hasModel = geometry || edges || projVisible;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-1">
        <h1 className="text-3xl font-bold">Drill Designer</h1>
        <p className="text-muted-foreground">
          Parametric twist-drill modeling on a real CAD kernel (OpenCASCADE) — exact solids, real STEP &amp; DXF.
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

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Tabs value={mode} onValueChange={(v) => setMode(v as ViewMode)}>
                <TabsList>
                  <TabsTrigger value="shaded">Shaded</TabsTrigger>
                  <TabsTrigger value="edges">Edges</TabsTrigger>
                  <TabsTrigger value="drawing">2D Drawing</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="aspect-video relative">
              {hasModel ? (
                mode === "drawing" ? (
                  <DrawingView visible={projVisible} hidden={projHidden} />
                ) : (
                  <DrillViewer
                    geometry={geometry}
                    edges={edges}
                    projVisible={projVisible}
                    projHidden={projHidden}
                    surfaceFinish={parameters.surfaceFinish}
                    mode={mode}
                  />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted/40 rounded-lg">
                  <p className="text-muted-foreground text-center px-6">
                    Set your parameters and press <span className="font-medium">Generate</span> to build the model.
                  </p>
                </div>
              )}

              {isBusy && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                  <div className="glass flex items-center gap-3 px-4 py-3 rounded-md">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-sm text-foreground">{status || "Working…"}</span>
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
