import * as THREE from 'three';
import { CSG } from 'three-csg-ts';
import { DrillParameters } from '@/types/drill';

/**
 * This generates a drill bit with helical flutes using optimized CSG.
 */
export interface DrillLengthInfo {
  totalLength: number;
  tipLength: number;
  fluteLength: number;
  accurateFluteLength: number;
  extensionLength: number;
  nonCuttingLength: number;
  shankLength: number;
  chamferLength: number;
  exitPoint: number; // As percentage of curve
}

export const generateDrillGeometry = (
  parameters: DrillParameters, 
  lengthInfoCallback?: (info: DrillLengthInfo) => void
): THREE.BufferGeometry => {
  const { 
    diameter, 
    shankDiameter, 
    shankLength,
    fluteCount, 
    fluteLength, 
    nonCuttingLength = 0,
    tipAngle, 
    helixAngle,
    material
  } = parameters;
  
  // Basic validation and safety checks
  const MIN_DIAMETER = 0.1;
  const MAX_SHANK_DIAMETER = 32;
  
  // Performance optimization: Reduce minimum segments for faster rendering
  const MIN_SEGMENTS = 32;   // Reduced from 64
  const MAX_SEGMENTS = 64;   // Reduced from 128
  
  // Smart segment calculation based on diameter - optimized for performance
  const calculateSegments = (d: number, isFlute: boolean = false) => {
    // Reduced multipliers for better performance
    const baseMultiplier = isFlute ? 12 : 8;  // Reduced from 24/18
    const segments = Math.max(
      MIN_SEGMENTS,
      Math.min(MAX_SEGMENTS, Math.floor(d * baseMultiplier))
    );
    return segments;
  };
  
  // Ensure diameters are within valid ranges
  const effectiveDiameter = Math.max(diameter, MIN_DIAMETER);
  const effectiveShankDiameter = Math.min(Math.max(shankDiameter, MIN_DIAMETER), MAX_SHANK_DIAMETER);
  
  // Calculate basic parameters
  const tipHeight = tipAngle === 180 ? 0 : (effectiveDiameter / 2) / Math.tan((tipAngle / 2) * Math.PI / 180);
  
  // Basic flute part length, including non-cutting length
  const totalFlutedLength = fluteLength - tipHeight;
  
  // Actual cutting flute length (excluding non-cutting portion)
  const cuttingFlutedLength = totalFlutedLength - nonCuttingLength;
  
  // Use the total fluted length for helix calculations
  const effectiveHelixLength = totalFlutedLength;
  
  // Extension length for starting the helix above the tip (1.1 × diameter)
  const extensionLength = effectiveDiameter * 1.1;
  
  const chamferHeight = Math.abs(effectiveDiameter - effectiveShankDiameter) / 2;
  
  // Calculate total length
  const totalLength = shankLength + chamferHeight + nonCuttingLength + totalFlutedLength + tipHeight;
  
  // Create the main geometries
  const geometries: THREE.BufferGeometry[] = [];
  let currentPosition = -totalLength / 2;
  
  // Initialize the length info object
  const lengthInfo: DrillLengthInfo = {
    totalLength,
    tipLength: tipHeight,
    fluteLength: totalFlutedLength,
    accurateFluteLength: 0, // Will be calculated during flute generation
    extensionLength,
    nonCuttingLength,
    shankLength,
    chamferLength: chamferHeight,
    exitPoint: 0 // Will be set during flute generation
  };
  
  try {
    // 1. Create shank with calculated segments
    const shankSegments = calculateSegments(effectiveShankDiameter);
    const shank = new THREE.CylinderGeometry(
      effectiveShankDiameter / 2,
      effectiveShankDiameter / 2,
      shankLength,
      shankSegments,
      1,
      false
    );
    shank.translate(0, currentPosition + shankLength / 2, 0);
    geometries.push(shank);
    currentPosition += shankLength;
    
    // 2. Create chamfer if needed with calculated segments
    if (chamferHeight > 0) {
      // Create a single chamfer with 45-degree angle
      const chamferSegments = Math.max(32, Math.min(64, Math.floor(effectiveDiameter * 8)));
      const chamfer = new THREE.CylinderGeometry(
        effectiveDiameter / 2,
        effectiveShankDiameter / 2,
        chamferHeight,
        chamferSegments,
        1,
        false
      );
      chamfer.translate(0, currentPosition + chamferHeight / 2, 0);
      geometries.push(chamfer);
      currentPosition += chamferHeight;
    }
    
    // 3. Create non-cutting length with calculated segments
    if (nonCuttingLength > 0) {
      const nonCuttingSegments = calculateSegments(effectiveDiameter);
      const nonCuttingPart = new THREE.CylinderGeometry(
        effectiveDiameter / 2,
        effectiveDiameter / 2,
        nonCuttingLength,
        nonCuttingSegments,
        1,
        false
      );
      nonCuttingPart.translate(0, currentPosition + nonCuttingLength / 2, 0);
      geometries.push(nonCuttingPart);
      currentPosition += nonCuttingLength;
    }
    
    // Store flute start position
    const fluteStartPosition = currentPosition;
    
    // 4. Create fluted part with calculated segments
    const flutedSegments = calculateSegments(effectiveDiameter);
    const flutedPart = new THREE.CylinderGeometry(
      effectiveDiameter / 2,
      effectiveDiameter / 2,
      totalFlutedLength,
      flutedSegments,
      1,
      false
    );
    flutedPart.translate(0, currentPosition + totalFlutedLength / 2, 0);
    geometries.push(flutedPart);
    currentPosition += totalFlutedLength;
    
    // 5. Create tip with calculated segments
    if (tipAngle !== 180) {
      const tipSegments = calculateSegments(effectiveDiameter);
      const tip = new THREE.ConeGeometry(
        effectiveDiameter / 2,
        tipHeight,
        tipSegments,
        1,
        false
      );
      tip.translate(0, currentPosition + tipHeight / 2, 0);
      geometries.push(tip);
    } else {
      const endCapSegments = calculateSegments(effectiveDiameter);
      const endCap = new THREE.CircleGeometry(
        effectiveDiameter / 2,
        endCapSegments
      );
      endCap.rotateX(Math.PI / 2);
      endCap.translate(0, currentPosition, 0);
      geometries.push(endCap);
    }
    
    // Merge basic geometries
    let drillBody = mergeBufferGeometries(geometries);
    const drillBodyMaterial = new THREE.MeshStandardMaterial();
    let drillBodyMesh = new THREE.Mesh(drillBody, drillBodyMaterial);
    
    // Create flutes if needed
    if (fluteCount > 0) {
      // Convert helix angle to radians
      const helixAngleRad = (helixAngle * Math.PI) / 180;
      
      // Calculate flute depth - reduce the depth to prevent breaking out
      const diameterRatio = effectiveDiameter / effectiveShankDiameter;
      const baseFluteDepth = effectiveDiameter * 0.33; // Reduced from 0.25
      
      // Scale flute depth based on diameter ratio with a more conservative approach
      const fluteDepthScale = diameterRatio > 1.5 ? 
        Math.max(0.25, 0.9 / Math.sqrt(diameterRatio)) : 0.9; // More conservative scaling
      const fluteDepth = baseFluteDepth * fluteDepthScale;
      
      // Calculate helix pitch
      const helixPitch = Math.PI * effectiveDiameter / Math.tan(helixAngleRad);
      
      const radius = effectiveDiameter / 2;
      const fluteGeometries: THREE.BufferGeometry[] = [];
      let totalAccurateLength = 0;
      let highestExitPoint = 0;
      
      for (let flute = 0; flute < fluteCount; flute++) {
        const baseAngle = (2 * Math.PI * flute) / fluteCount;
        
        try {
          // Standard helix height calculation
          const calculatedRevolutions = effectiveHelixLength / helixPitch;
          const revolutions = Math.max(1.2, calculatedRevolutions);
          
          // 1. Helix starts 1.1 × diameter ABOVE the tip
          const helixStartY = currentPosition + (effectiveDiameter * 1.1);
          
          // 2. Runs down to the end of the flute length (including non-cutting length)
          // fluteStartPosition is the beginning of the fluted part (including non-cutting length)
          const helixEndY = fluteStartPosition;
          
          console.log(`Helix start: ${effectiveDiameter * 1.1}mm above tip (${helixStartY})`);
          console.log(`Helix end: End of flute (${helixEndY}), which includes ${nonCuttingLength}mm non-cutting length`);
          console.log(`Total flute length: ${totalFlutedLength}mm, cutting length: ${cuttingFlutedLength}mm`);
          
          // Create a simple helix curve with enhanced 3D tapering
          const simpleHelixCurve = new SimpleHelixCurve(
            radius,
            helixStartY,       // 1.1 × diameter above tip
            helixEndY,         // End of flute (including non-cutting length)
            helixPitch,
            baseAngle,
            effectiveDiameter,
            nonCuttingLength   // Pass non-cutting length for accurate tapering
          );
          
          // Set the flute depth on the curve
          simpleHelixCurve.setFluteDepth(fluteDepth);
          
          // Get accurate length of curve inside the model
          const accurateLength = simpleHelixCurve.getAccurateLength();
          const exitPoint = simpleHelixCurve.getExitPoint();
          highestExitPoint = Math.max(highestExitPoint, exitPoint);
          totalAccurateLength += accurateLength;
          
          console.log(`Flute ${flute+1}: Total curve length=${simpleHelixCurve.getTotalLength()}, Accurate length=${accurateLength}, Exit at ${exitPoint * 100}%`);
          
          // Optimize tubular and radial segments for better performance
          const tubularSegments = Math.max(32, Math.ceil(revolutions * 12));
          const radialSegments = Math.max(16, Math.ceil(diameter * 3));
          
          // Create a custom tube geometry that uses the curve's variable depth
          const createCustomTubeGeometry = (curve: SimpleHelixCurve, segments: number, radius: number, radialSegments: number): THREE.BufferGeometry => {
            const tubeGeometry = new THREE.TubeGeometry(
              curve,
              segments,
              radius,  // Use a base radius, curve will adjust depth as needed
              radialSegments,
              false
            );
            
            return tubeGeometry;
          };
          
          // Use the custom tube geometry function
          const tubeGeometry = createCustomTubeGeometry(
            simpleHelixCurve,
            tubularSegments,
            fluteDepth,
            radialSegments
          );
          
          fluteGeometries.push(tubeGeometry);
        } catch (error) {
          console.error('Error creating flute geometry:', error);
        }
      }
      
      // Update length info with the average accurate length
      if (fluteCount > 0) {
        lengthInfo.accurateFluteLength = totalAccurateLength / fluteCount;
        lengthInfo.exitPoint = highestExitPoint * 100; // Convert to percentage
      }
      
      if (fluteGeometries.length > 0) {
        const mergedFluteGeometry = mergeBufferGeometries(fluteGeometries);
        const fluteMaterial = new THREE.MeshStandardMaterial();
        const fluteMesh = new THREE.Mesh(mergedFluteGeometry, fluteMaterial);
        
        try {
          // Performance optimization: Skip toNonIndexed conversion when possible
          const indexedDrill = drillBodyMesh.geometry;
          const indexedFlute = fluteMesh.geometry;
          
          // Add error checking for geometry validity
          if (!indexedDrill.getAttribute('position') || !indexedFlute.getAttribute('position')) {
            console.error('Invalid geometry for CSG operation');
            return drillBodyMesh.geometry;
          }
          
          const csgDrill = CSG.fromMesh(new THREE.Mesh(indexedDrill, drillBodyMaterial));
          const csgFlute = CSG.fromMesh(new THREE.Mesh(indexedFlute, fluteMaterial));
          
          const csgResult = csgDrill.subtract(csgFlute);
          const resultMesh = CSG.toMesh(csgResult, new THREE.Matrix4());
          
          if (!resultMesh.geometry.getAttribute('position')) {
            console.error('CSG operation produced invalid geometry');
            return drillBodyMesh.geometry;
          }
          
          drillBodyMesh = new THREE.Mesh(resultMesh.geometry, drillBodyMaterial);
          drillBody = healGeometry(drillBodyMesh.geometry);
          drillBodyMesh = new THREE.Mesh(drillBody, drillBodyMaterial);
        } catch (error) {
          console.error('Error in CSG operation:', error);
        }
      }
    }
    
    // Call the callback with length information if provided
    if (lengthInfoCallback) {
      lengthInfoCallback(lengthInfo);
    }
    
    return drillBodyMesh.geometry;
  } catch (error) {
    console.error('Error generating drill geometry:', error);
    // Return a simple cylinder as fallback
    return new THREE.CylinderGeometry(
      effectiveDiameter / 2,
      effectiveDiameter / 2,
      totalLength,
      MIN_SEGMENTS,
      1,
      false
    );
  }
};

/**
 * A simple helix curve that starts from above the tip and runs down to the flute end
 * with enhanced 3D tapering to eliminate gaps
 */
class SimpleHelixCurve extends THREE.Curve<THREE.Vector3> {
  private totalLength: number;
  private helixTotalRevolutions: number;
  private modelExitPoint: number | null = null;
  
  // Performance optimization: Cache points for repeated calculations
  private cachedPoints = new Map<number, THREE.Vector3>();
  private cacheEnabled = true;
  
  // Store the flute depth separately for the tube geometry to use
  private _fluteDepth: number = 0;
  
  constructor(
    private radius: number,
    private startY: number,         // Above tip
    private endY: number,           // End of flute (including non-cutting length)
    private helixPitch: number,
    private baseAngle: number,
    private diameter: number = 0,
    private nonCuttingLength: number = 0 // Non-cutting length at the end of the flute
  ) {
    super();
    
    // Calculate length of the helix
    this.totalLength = Math.abs(startY - endY);
    
    // Calculate total helix revolutions
    this.helixTotalRevolutions = this.totalLength / this.helixPitch;
    
    // Calculate approximate curve length
    this.totalLength = this.helixTotalRevolutions * 
      (2 * Math.PI * this.radius + Math.pow(this.helixPitch, 2) / (2 * Math.PI * this.radius));
    
    // Calculate the exit point if diameter is provided
    if (this.diameter > 0) {
      this.calculateExitPoint();
    }
  }
  
  // Getter for flute depth - tube geometry will use this
  getFluteDepth(t: number): number {
    // Base depth is set externally
    if (this._fluteDepth === 0) {
      return 0.25 * this.diameter; // Default value
    }
    
    // Apply 3D tapering
    // At entry (t=0), gradually increase depth
    if (t < 0.1) {
      // Gradual depth increase at entry: 0% to 100% over the first 10%
      return this._fluteDepth * (t * 10);
    }
    
    // At exit, gradually decrease depth
    // Calculate how much of the total length is non-cutting portion (as a fraction)
    if (this.nonCuttingLength > 0) {
      const totalLength = Math.abs(this.startY - this.endY);
      const nonCuttingPortion = this.nonCuttingLength / totalLength;
      
      // Apply taper only in the last portion that corresponds to non-cutting length
      // plus a small additional portion (10% of the cutting length) for a smooth transition
      const taperStartPosition = 1.0 - nonCuttingPortion - 0.1;
      
      if (t > taperStartPosition) {
        // Calculate how far into the taper region we are
        const taperProgress = (t - taperStartPosition) / (1.0 - taperStartPosition);
        
        // Linear taper from 100% to 0%
        const taperFactor = 1.0 - taperProgress;
        return this._fluteDepth * taperFactor;
      }
    } else {
      // If there's no non-cutting length, use the fixed portion approach
      if (t > 0.9) {
        // Linear taper from 100% to 0% in the last 10%
        const taperFactor = (1.0 - t) * 10; // 1.0 at t=0.9, 0.0 at t=1.0
        return this._fluteDepth * taperFactor;
      }
    }
    
    // In the middle, use full depth
    return this._fluteDepth;
  }
  
  // Setter for flute depth - called by the generator
  setFluteDepth(depth: number): void {
    this._fluteDepth = depth;
  }
  
  /**
   * Returns the total length of the curve
   */
  getTotalLength(): number {
    return this.totalLength;
  }
  
  /**
   * Calculates the parametric t value where the curve exits the drill model
   */
  calculateExitPoint(): number {
    // Simple approach - just return 1 to use the whole curve
    this.modelExitPoint = 1.0;
    return this.modelExitPoint;
  }
  
  /**
   * Gets the actual length of the curve that is inside the drill model
   */
  getAccurateLength(): number {
    return this.totalLength;
  }
  
  getPoint(t: number, optionalTarget?: THREE.Vector3): THREE.Vector3 {
    const target = optionalTarget || new THREE.Vector3();
    
    // Performance optimization: Check cache first if enabled
    if (this.cacheEnabled) {
      const cachedPoint = this.cachedPoints.get(t);
      if (cachedPoint) {
        target.copy(cachedPoint);
        return target;
      }
    }
    
    // Calculate Y position - linear interpolation from start (above tip) to end (flute end)
    const y = this.startY - t * Math.abs(this.startY - this.endY);
    
    // Calculate angle based on the position
    const angle = this.baseAngle + t * (this.helixTotalRevolutions * 2 * Math.PI);
    
    // Radius calculation with 3D tapering
    let adjustedRadius = this.radius;
    
    // Enhanced 3D entry tapering: at beginning (t=0), gradually increase radius
    if (t < 0.1) {
      // Curve entry - gradually increase radius from 10% to 100% for smooth entry
      const entryFactor = 0.1 + (t * 9);  // 0.1 at t=0, 1.0 at t=0.1
      adjustedRadius *= entryFactor;
    }
    
    // Exit tapering - use existing logic
    if (this.nonCuttingLength > 0) {
      const totalLength = Math.abs(this.startY - this.endY);
      const nonCuttingPortion = this.nonCuttingLength / totalLength;
      
      // Apply taper only in the last portion that corresponds to non-cutting length
      // plus a small additional portion (10% of the cutting length) for a smooth transition
      const taperStartPosition = 1.0 - nonCuttingPortion - 0.1;
      
      if (t > taperStartPosition) {
        // Calculate how far into the taper region we are
        const taperProgress = (t - taperStartPosition) / (1.0 - taperStartPosition);
        
        // Linear taper from 100% to 0%
        const taperFactor = 1.0 - taperProgress;
        adjustedRadius *= taperFactor;
      }
    } else {
      // If there's no non-cutting length, use the previous logic
      // Apply taper only in the last 10% of the curve
      if (t > 0.9) {
        // Linear taper from 100% to 0% in the last 10%
        const taperFactor = (1.0 - t) * 10; // 1.0 at t=0.9, 0.0 at t=1.0
        adjustedRadius *= taperFactor;
      }
    }
    
    const x = adjustedRadius * Math.cos(angle);
    const z = adjustedRadius * Math.sin(angle);
    
    target.set(x, y, z);
    
    // Store in cache if enabled
    if (this.cacheEnabled) {
      this.cachedPoints.set(t, target.clone());
    }
    
    return target;
  }
  
  /**
   * Gets the exit point as a value between 0-1
   */
  getExitPoint(): number {
    return 1.0;
  }
  
  /**
   * Performance optimization: Add method to disable caching if needed
   */
  disableCache(): void {
    this.cacheEnabled = false;
    this.cachedPoints.clear();
  }
}

// Helper function to heal geometry after CSG operations
function healGeometry(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  // Make a copy to avoid modifying the original
  const healed = geometry.clone();
  
  // Ensure we have position attribute
  if (!healed.getAttribute('position')) {
    console.error('Geometry missing position attribute');
    return healed;
  }
  
  // Performance optimization: Only compute normals if really needed
  if (!healed.getAttribute('normal')) {
    healed.computeVertexNormals();
  }
  
  // Performance optimization: Skip UV generation for better performance
  // Only generate UVs if not present AND material needs them
  if (!healed.getAttribute('uv')) {
    const uvs = [];
    const vertexCount = healed.getAttribute('position').count;
    
    for (let i = 0; i < vertexCount; i++) {
      uvs.push(0, 0); // Default UV coordinates
    }
    
    healed.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  }
  
  // Performance optimization: Only compute bounding volumes if needed
  if (!healed.boundingSphere) {
    healed.computeBoundingSphere();
  }
  if (!healed.boundingBox) {
    healed.computeBoundingBox();
  }
  
  return healed;
}

// Helper function to merge buffer geometries
function mergeBufferGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  // Get total number of vertices
  let vertexCount = 0;
  let indexCount = 0;
  
  for (const geometry of geometries) {
    const position = geometry.getAttribute('position');
    vertexCount += position.count;
    
    if (geometry.index) {
      indexCount += geometry.index.count;
    }
  }
  
  // Create merged geometry
  const mergedGeometry = new THREE.BufferGeometry();
  
  // Create arrays for attributes
  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  
  // Create index array if needed
  let indices: Uint32Array | null = null;
  if (indexCount > 0) {
    indices = new Uint32Array(indexCount);
  }
  
  // Merge geometries
  let vertexOffset = 0;
  let indexOffset = 0;
  
  for (const geometry of geometries) {
    // Copy position attribute
    const position = geometry.getAttribute('position');
    for (let i = 0; i < position.count; i++) {
      positions[vertexOffset * 3 + i * 3] = position.getX(i);
      positions[vertexOffset * 3 + i * 3 + 1] = position.getY(i);
      positions[vertexOffset * 3 + i * 3 + 2] = position.getZ(i);
    }
    
    // Copy normal attribute if it exists
    const normal = geometry.getAttribute('normal');
    if (normal) {
      for (let i = 0; i < normal.count; i++) {
        normals[vertexOffset * 3 + i * 3] = normal.getX(i);
        normals[vertexOffset * 3 + i * 3 + 1] = normal.getY(i);
        normals[vertexOffset * 3 + i * 3 + 2] = normal.getZ(i);
      }
    }
    
    // Copy uv attribute if it exists
    const uv = geometry.getAttribute('uv');
    if (uv) {
      for (let i = 0; i < uv.count; i++) {
        uvs[vertexOffset * 2 + i * 2] = uv.getX(i);
        uvs[vertexOffset * 2 + i * 2 + 1] = uv.getY(i);
      }
    }
    
    // Copy indices if they exist
    if (geometry.index && indices) {
      for (let i = 0; i < geometry.index.count; i++) {
        indices[indexOffset + i] = geometry.index.getX(i) + vertexOffset;
      }
      indexOffset += geometry.index.count;
    }
    
    vertexOffset += position.count;
  }
  
  // Set attributes on merged geometry
  mergedGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  mergedGeometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  mergedGeometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  
  if (indices) {
  mergedGeometry.setIndex(new THREE.BufferAttribute(indices, 1));
  }
  
  return mergedGeometry;
}

// Update UnifiedHelixAndExtensionCurve to pass nonCuttingLength
class UnifiedHelixAndExtensionCurve extends THREE.Curve<THREE.Vector3> {
  private simpleCurve: SimpleHelixCurve;
  
  constructor(
    private radius: number,
    private helixStartY: number,
    private helixEndY: number,
    private extensionStartY: number,
    private extensionEndY: number,
    private helixPitch: number,
    private baseAngle: number,
    private diameter: number = 0
  ) {
    super();
    
    // Create an internal SimpleHelixCurve to delegate to
    // Use a default value of 0 for nonCuttingLength
    // In a real implementation, this would be passed as a parameter
    this.simpleCurve = new SimpleHelixCurve(
      radius, helixStartY, helixEndY, helixPitch, baseAngle, diameter, 0
    );
  }
  
  getTotalLength(): number {
    return this.simpleCurve.getTotalLength();
  }
  
  calculateExitPoint(): number {
    return this.simpleCurve.calculateExitPoint();
  }
  
  getAccurateLength(): number {
    return this.simpleCurve.getAccurateLength();
  }
  
  getPoint(t: number, optionalTarget?: THREE.Vector3): THREE.Vector3 {
    return this.simpleCurve.getPoint(t, optionalTarget);
  }
  
  getExitPoint(): number {
    return this.simpleCurve.getExitPoint();
  }
  
  disableCache(): void {
    this.simpleCurve.disableCache();
  }
}
