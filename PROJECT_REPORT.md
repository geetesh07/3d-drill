# Project Report — Drill Designer Pro (3D Parametric Tool Generator)

**Prepared:** 2026-06-13
**Folder:** `E:\Geetesh\3d`
**Stack name:** `vite_react_shadcn_ts` · **Version:** 0.0.0 (early)

---

## 1. Executive summary

A **web-based 3D parametric CAD application** for designing **cutting tools** (starting
with twist drill bits). The user enters engineering parameters — diameter, shank
diameter/length, flute count, flute length, tip angle, helix angle, material, surface
finish, tolerance — and the app **generates a real 3D solid model in the browser**,
renders it interactively in WebGL, and exports it to manufacturing formats
(**STEP, DXF**) plus a tolerance/GD&T **spec sheet**.

Think "parametric SolidWorks-for-drills, in the browser": pick numbers, get a true
3D model and production-ready outputs, without desktop CAD.

---

## 2. Problem it solves

Designing manufacturable cutting-tool models in desktop CAD (SolidWorks/CATIA) is
slow and requires expertise. Tools in a family differ only by parameters, yet each
is modeled by hand. This app turns tool design into **parameter entry → instant 3D
model → instant exports (STEP/DXF/spec)**, accessible to anyone with a browser.

---

## 3. What it does (current scope)

- **Drill Generator** (live, `/drill-generator`): full parametric 3D drill bit.
- **Step Drill / Reamer / Endmill Generators**: routed but **"Coming Soon"** stubs.
- **3D viewer**: interactive WebGL preview, edge view, projection demos.
- **Exports**: 3D **STEP** (ISO-10303), **DXF** 2D drawing, **spec sheet** with
  tolerances and GD&T callouts.
- **Accounts**: Supabase auth — signup/login, protected routes, profile, settings,
  **admin dashboard** + role management, **pricing** page (commercial/SaaS intent).

### Parameter model (`src/types/drill.d.ts`)
`diameter, length, shankDiameter, shankLength, fluteCount (2–3), fluteLength,
nonCuttingLength, tipAngle (0–180), helixAngle (0–60), material
(hss|carbide|cobalt|titanium), surfaceFinish (polished|black-oxide|tin|aln),
tolerance`. Includes `validateDrillParameters()` enforcing physical sanity
(positive dims, min-length rule, angle/flute ranges).

---

## 4. How it works (pipeline)

```
Parameter form (ParameterInput / ToolSelector)
   │
   ▼
3D geometry generation
   • Three.js + CSG (three-csg-ts) → helical-fluted solid   [drillGenerator.ts]
   • OpenCASCADE.js (WASM) wired for true B-rep CAD          [opencascadeInit.ts, wasmLoader.ts]
   │
   ├─► WebGL render  (DrillViewer / DrillEdgeView, three.js)
   │
   ├─► 2D projection: three-mesh-bvh + three-edge-projection
   │      compute visible edges → DXF                        [projectionGenerator.ts, enhancedDXFExporter.ts]
   │
   ├─► STEP export (ISO-10303-21 text)                       [stepGenerator.ts]
   │
   └─► Spec sheet (dimensions + tolerance bands + GD&T)      [specGenerator.ts]
```

A key technical theme is **deriving accurate 2D engineering drawings from the 3D
model** via BVH-accelerated edge projection — the likely integration point with the
separate 2D PDF placement service (`parameteric-drawing-gen-main`), which drops such
drawings into customer title-blocks.

---

## 5. Architecture & stack

**Frontend / app shell**
- React 18, Vite 5, TypeScript 5, React Router 6.
- shadcn/ui (Radix primitives) + Tailwind CSS + `next-themes` (light/dark).
- TanStack Query, Zustand (state), React Hook Form + Zod (forms/validation),
  Sonner/react-hot-toast (toasts).

**3D / CAD engine**
- `three` (+ `@types/three`) — rendering & scene.
- `three-csg-ts` — constructive solid geometry (boolean cuts for flutes).
- `opencascade.js` (WASM) — industrial CAD kernel for B-rep / STEP.
- `three-mesh-bvh` + `three-edge-projection` (gkjohnson) — edge extraction for 2D.
- `clipper2-js`, `dxf-writer`, `@types/dxf` — 2D polygon ops + DXF output.
- Vite plugins: `vite-plugin-wasm`, `vite-plugin-top-level-await`,
  compression, terser.

**Backend / infra**
- **Supabase** (`@supabase/supabase-js`) — auth, user data, roles (`public` schema).
- Built by **Lovable** (`lovable-tagger` dev dep) — i.e. AI-assisted scaffolding.

**Key directories (`src/`)**
- `lib/` — generation + export engines (drill, step, DXF, projection, spec, jscad,
  opencascade init, wasm loader, supabase, utils).
- `pages/` — Home, Drill/Step/Reamer/Endmill generators, Pricing, auth, admin,
  legal (Terms/Privacy), Profile/Settings.
- `components/` — `DrillViewer`, `DrillEdgeView`, `ParameterInput`, `ToolSelector`,
  `ExportDialog`, `projection/*`, route guards, layout, `ui/` (shadcn).
- `context/` — `AuthContext`, `SettingsContext`. `hooks/`, `types/`.

---

## 6. Current state & signals

- **Drill** path is the working core; other tool types are placeholders.
- `src/lib/` contains telling scratch files:
  `bvh but it is broken -_- that works but is slow.txt`,
  `three-csg-js that works but is slow copy.txt` — i.e. the **3D→2D projection and
  CSG performance are the hard, partially-unsolved problems**.
- Has commercial scaffolding (pricing, auth, admin/roles) → intended as a **SaaS**.
- No README or test setup in this folder; not under git at the workspace root.

---

## 7. Risks & recommendations (to reach production quality)

| Area | Risk | Recommendation |
|---|---|---|
| Performance | CSG + edge projection are slow/"broken" per scratch notes | Decide canonical engine (OpenCASCADE B-rep vs three-csg); move heavy work to Web Workers; cache geometry |
| 3D→2D accuracy | DXF/projection correctness is the core value & the weak point | Build a fixture set of known drills with golden DXF/STEP; visual + numeric diff tests |
| Secrets | `VITE_SUPABASE_SERVICE_ROLE_KEY` referenced in client (`supabase.ts`) | **Never ship the service-role key to the browser** — it bypasses RLS; move admin ops server-side |
| Auth/roles | Admin role + "SetAdmin"/"set-admin" routes in client | Enforce row-level security + server checks; client role is not a trust boundary |
| Version control | No git history/CI | `git init`, `.gitignore` (node_modules, dist, `.env`), CI for build+lint |
| Scope | 3 generators are empty stubs | Sequence the roadmap; ship drill end-to-end (model→STEP→DXF→spec) before breadth |
| Validation | Geometry can still produce non-manufacturable shapes | Extend `validateDrillParameters` with manufacturability rules + UI feedback |

---

## 8. Relationship to the sibling folder

`E:\Geetesh\parameteric-drawing-gen-main` is a **separate** 2D PDF microservice that
places drawing views into ERP title-blocks. It is **not** this project, but the DXF/
2D projections this app produces are a natural input to it. Keep the boundary clear:
**this `3d` app = parametric 3D modeling + CAD export**; the other = PDF assembly.

---

## 9. Glossary

- **CSG** — Constructive Solid Geometry; booleans (e.g., cutting flutes from a cylinder).
- **B-rep** — Boundary representation; precise CAD solids (OpenCASCADE/STEP).
- **STEP** — ISO-10303 neutral 3D CAD exchange format.
- **DXF** — 2D drawing exchange format.
- **BVH** — Bounding Volume Hierarchy; accelerates raycast/edge projection.
- **Edge projection** — extracting visible silhouette/feature edges to make a 2D view.
- **GD&T** — Geometric Dimensioning & Tolerancing.
