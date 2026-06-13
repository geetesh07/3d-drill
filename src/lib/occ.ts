/**
 * OpenCASCADE.js loader.
 *
 * Uses the dynamic ("customizable") build: a small core (opencascade.wasm) plus
 * pre-linked toolkit bundles loaded on demand. We load:
 *   - modelingAlgorithms : primitives, booleans, fillets, meshing, HLR
 *   - dataExchangeBase   : STEP read/write
 *
 * `getOC()` is a singleton — the heavy WASM download happens once, on first call.
 */
import ocFactory from "opencascade.js/dist/opencascade.js";
import mainWasmUrl from "opencascade.js/dist/opencascade.wasm?url";
import coreUrl from "opencascade.js/dist/opencascade.core.wasm?url";
import modelingAlgorithmsUrl from "opencascade.js/dist/opencascade.modelingAlgorithms.wasm?url";
import dataExchangeBaseUrl from "opencascade.js/dist/opencascade.dataExchangeBase.wasm?url";
import tkStepUrl from "opencascade.js/dist/module.TKSTEP.wasm?url";

// The instance is loosely typed (the full typings are enormous); we treat it as `any`.
export type OpenCascadeInstance = any;

let _oc: OpenCascadeInstance | null = null;
let _initPromise: Promise<OpenCascadeInstance> | null = null;

export type OCProgress = (message: string) => void;

const DYLIB_OPTS = {
  loadAsync: true,
  global: true,
  nodelete: true,
  allowUndefined: false,
};

/** Initialize (once) and return the OpenCASCADE instance. */
export async function getOC(onProgress?: OCProgress): Promise<OpenCascadeInstance> {
  if (_oc) return _oc;
  if (!_initPromise) {
    _initPromise = (async () => {
      onProgress?.("Loading OpenCASCADE core…");
      const oc: OpenCascadeInstance = await ocFactory({
        locateFile: (p: string) => (p.endsWith(".wasm") ? mainWasmUrl : p),
      });

      onProgress?.("Loading core toolkits…");
      await oc.loadDynamicLibrary(coreUrl, DYLIB_OPTS);

      onProgress?.("Loading modeling algorithms…");
      await oc.loadDynamicLibrary(modelingAlgorithmsUrl, DYLIB_OPTS);

      onProgress?.("Loading STEP / data exchange…");
      await oc.loadDynamicLibrary(dataExchangeBaseUrl, DYLIB_OPTS);
      // The dataExchangeBase bundle ships the STEP engine but not the high-level
      // STEPControl_Writer wrapper; load the TKSTEP toolkit module to expose it.
      await oc.loadDynamicLibrary(tkStepUrl, DYLIB_OPTS);

      _oc = oc;
      if (import.meta.env.DEV && typeof window !== "undefined") {
        (window as unknown as Record<string, unknown>).__oc = oc;
      }
      onProgress?.("OpenCASCADE ready.");
      return oc;
    })();
  }
  return _initPromise;
}

/** True once the instance has finished loading. */
export function isOCReady(): boolean {
  return _oc !== null;
}

/**
 * Smoke test: exercises modeling (cylinder + cone), a boolean fuse, meshing, and
 * a STEP write. Proves all required toolkit bundles are linked. Dev-only.
 */
export async function occSmokeTest(): Promise<{ ok: boolean; faces?: number; stepBytes?: number; error?: string }> {
  const log = (m: string) => console.log("[OCC]", m);
  try {
    const oc = await getOC(log);

    log("Building cylinder + cone…");
    const cyl = new oc.BRepPrimAPI_MakeCylinder_1(5, 30).Shape();
    const cone = new oc.BRepPrimAPI_MakeCone_1(5, 0, 8).Shape();

    log("Boolean fuse…");
    const shape = new oc.BRepAlgoAPI_Fuse_3(cyl, cone).Shape();

    log("Meshing…");
    new oc.BRepMesh_IncrementalMesh_2(shape, 0.1, false, 0.5, false);

    log("Counting faces…");
    let faces = 0;
    const exp = new oc.TopExp_Explorer_2(
      shape,
      oc.TopAbs_ShapeEnum.TopAbs_FACE,
      oc.TopAbs_ShapeEnum.TopAbs_SHAPE
    );
    for (; exp.More(); exp.Next()) faces++;

    log("Writing STEP…");
    const writer = new oc.STEPControl_Writer_1();
    writer.Transfer(
      shape,
      oc.STEPControl_StepModelType.STEPControl_AsIs,
      true,
      new oc.Message_ProgressRange_1()
    );
    const fname = "/smoke.step";
    writer.Write(fname);
    const stepData: string = oc.FS.readFile(fname, { encoding: "utf8" });

    log(`✅ smoke test OK — faces=${faces}, stepBytes=${stepData.length}`);
    return { ok: true, faces, stepBytes: stepData.length };
  } catch (e) {
    const msg = (e && (e as { message?: string }).message) || String(e);
    console.error("[OCC] ❌ smoke test failed:", msg, e);
    return { ok: false, error: msg };
  }
}

// Expose the smoke test in dev so it can be triggered from the browser console / tooling.
if (import.meta.env.DEV && typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).__occSmoke = occSmokeTest;
}
