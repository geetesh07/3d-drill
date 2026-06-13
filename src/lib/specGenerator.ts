import { DrillParameters } from '@/types/drill';

// Helper function to format tolerance for display
export const formatTolerance = (tol: string): string => {
  switch (tol) {
    case 'h6': return '0 to -0.016 mm';
    case 'h7': return '0 to -0.025 mm';
    case 'h8': return '0 to -0.039 mm';
    case 'h9': return '0 to -0.062 mm';
    case 'h10': return '0 to -0.100 mm';
    case 'H6': return '+0.016 to 0 mm';
    case 'H7': return '+0.025 to 0 mm';
    case 'H8': return '+0.039 to 0 mm';
    default: return tol;
  }
};

// Format material for display
export const formatMaterial = (mat: string): string => {
  switch (mat) {
    case 'hss': return 'High Speed Steel';
    case 'carbide': return 'Solid Carbide';
    case 'cobalt': return 'Cobalt Steel';
    case 'titanium': return 'Titanium Coated HSS';
    default: return mat;
  }
};

// Format surface finish for display
export const formatSurfaceFinish = (finish: string): string => {
  switch (finish) {
    case 'polished': return 'Polished';
    case 'black-oxide': return 'Black Oxide';
    case 'tin': return 'Titanium Nitride Coated';
    case 'aln': return 'Aluminum Nitride Coated';
    default: return finish;
  }
};

// Helper function to get recommendation based on flute count
export const getFluteRecommendation = (fluteCount: number): string => {
  switch (fluteCount) {
    case 1: return 'Reamer applications, deep hole drilling';
    case 2: return 'General purpose drilling, softer materials';
    case 3: return 'Medium to hard materials, improved chip evacuation';
    case 4: return 'Harder materials, precision applications';
    default: return 'General purpose';
  }
};

// Helper function to get coolant recommendation based on material
export const getCoolantRecommendation = (material: string): string => {
  switch (material) {
    case 'hss': return 'Required for most applications';
    case 'carbide': return 'Recommended for most applications';
    case 'cobalt': return 'Required for higher temperature applications';
    case 'titanium': return 'Recommended but can be used dry in some applications';
    default: return 'Recommended';
  }
};

// Generate technical specifications string
export const generateTechnicalSpecs = (parameters: DrillParameters): string => {
  const { 
    diameter, 
    length, 
    shankDiameter, 
    fluteCount, 
    fluteLength, 
    tipAngle, 
    helixAngle, 
    tolerance, 
    material,
    surfaceFinish 
  } = parameters;
  
  // Build the specifications string
  return `
    TECHNICAL SPECIFICATIONS
    
    Geometry:
    - Diameter: ${diameter} mm ${tolerance} (${formatTolerance(tolerance)})
    - Overall Length: ${length} mm
    - Shank Diameter: ${shankDiameter} mm
    - Flute Length: ${fluteLength} mm
    - Tip Angle: ${tipAngle}°
    - Helix Angle: ${helixAngle}°
    - Number of Flutes: ${fluteCount}
    
    Materials:
    - Material: ${formatMaterial(material)}
    - Surface Treatment: ${formatSurfaceFinish(surfaceFinish)}
    
    Application:
    - Recommended for: ${getFluteRecommendation(fluteCount)}
    - Coolant Requirement: ${getCoolantRecommendation(material)}
    
    Tolerances:
    - Diameter: ${formatTolerance(tolerance)}
    - Length: ±0.5 mm
    - Runout: 0.02 mm TIR (Total Indicator Reading)
    - Concentricity: 0.01 mm
  `;
};

// Generate AutoCAD usage instructions
export const generateAutoCADInstructions = (fileName: string): string => {
  return `
    AUTOCAD USAGE INSTRUCTIONS FOR ${fileName}
    
    For DXF/DWG Files:
    1. Open AutoCAD
    2. Go to File > Open
    3. Select the downloaded ${fileName} file
    4. The drawing will open directly in AutoCAD
    
    For JSCAD Files (JavaScript):
    1. This is a parametric model script that needs to be converted to DXF/DWG first
    2. Use the online converter at https://openjscad.xyz
    3. Upload the ${fileName} file
    4. Click "Generate" and then export as DXF
    5. Open the exported DXF file in AutoCAD
    
    For PDF Technical Drawings:
    1. Open the PDF in Adobe Reader or similar
    2. Use it as reference documentation
    3. All dimensions are in millimeters unless otherwise noted
    
    Note: For direct manufacturing, we recommend using the DXF/DWG or STEP formats.
  `;
};
