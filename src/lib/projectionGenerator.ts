import * as THREE from 'three';
import { MeshBVH } from 'three-mesh-bvh';

interface Edge {
  start: THREE.Vector3;
  end: THREE.Vector3;
  normal1: THREE.Vector3;
  normal2?: THREE.Vector3;
  type?: 'boundary' | 'intersection' | 'regular';
}

interface DebugVisualization {
  edges: THREE.LineSegments;
  normals?: THREE.LineSegments;
  points?: THREE.Points;
  boundaryEdges?: THREE.LineSegments;
  intersectionEdges?: THREE.LineSegments;
  regularEdges?: THREE.LineSegments;
}

export interface ProjectionGeneratorOptions {
  debug?: boolean;
  debugColors?: Partial<{
    regular: number;
    boundary: number;
    intersection: number;
    normals: number;
    points: number;
  }>;
}

export class ProjectionGenerator {
  public sortEdges: boolean = true;
  public iterationTime: number = 80;
  public angleThreshold: number = 40;
  public includeIntersectionEdges: boolean = false;
  public debugVisualization: DebugVisualization | null = null;

  private edges: Map<string, Edge> = new Map();
  private lastYieldTime: number = 0;
  private debugOptions: Required<ProjectionGeneratorOptions> = {
    debug: false,
    debugColors: {
      regular: 0x0000ff,      // Blue
      boundary: 0xff0000,     // Red
      intersection: 0x00ff00,  // Green
      normals: 0xff00ff,      // Magenta
      points: 0xffff00        // Yellow
    }
  };

  constructor(options?: ProjectionGeneratorOptions) {
    if (options) {
      this.debugOptions = {
        ...this.debugOptions,
        ...options,
        debugColors: {
          ...this.debugOptions.debugColors,
          ...(options.debugColors || {})
        }
      };
    }
  }

  private getEdgeKey(v1: THREE.Vector3, v2: THREE.Vector3): string {
    // Create a consistent key regardless of vertex order
    return v1.x < v2.x || (v1.x === v2.x && (v1.y < v2.y || (v1.y === v2.y && v1.z < v2.z)))
      ? `${v1.x},${v1.y},${v1.z}-${v2.x},${v2.y},${v2.z}`
      : `${v2.x},${v2.y},${v2.z}-${v1.x},${v1.y},${v1.z}`;
  }

  private shouldYield(): boolean {
    const currentTime = performance.now();
    if (currentTime - this.lastYieldTime > this.iterationTime) {
      this.lastYieldTime = currentTime;
      return true;
    }
    return false;
  }

  private processEdges(geometry: THREE.BufferGeometry | MeshBVH): THREE.BufferGeometry {
    const positionAttr = geometry instanceof THREE.BufferGeometry 
      ? geometry.getAttribute('position')
      : geometry.geometry.getAttribute('position');

    const vertices: number[] = [];
    const indices: number[] = [];
    const angleThresholdRad = THREE.MathUtils.degToRad(this.angleThreshold);
    this.edges.clear();

    // Process triangles and collect edges
    for (let i = 0; i < positionAttr.count; i += 3) {
      const v1 = new THREE.Vector3().fromBufferAttribute(positionAttr, i);
      const v2 = new THREE.Vector3().fromBufferAttribute(positionAttr, i + 1);
      const v3 = new THREE.Vector3().fromBufferAttribute(positionAttr, i + 2);

      const normal = new THREE.Vector3()
        .crossVectors(
          new THREE.Vector3().subVectors(v2, v1),
          new THREE.Vector3().subVectors(v3, v1)
        )
        .normalize();

      if (Math.abs(normal.y) < Math.cos(angleThresholdRad)) {
        this.processTriangleEdges(v1, v2, v3, normal);
      }
    }

    // Build geometry from collected edges
    const edgesByType: Record<'boundary' | 'intersection' | 'regular', { vertices: number[]; indices: number[] }> = {
      boundary: { vertices: [], indices: [] },
      intersection: { vertices: [], indices: [] },
      regular: { vertices: [], indices: [] }
    };

    for (const edge of this.edges.values()) {
      if (this.shouldIncludeEdge(edge)) {
        const type = this.getEdgeType(edge);
        edge.type = type;
        const targetArray = edgesByType[type];
        
        const baseIndex = targetArray.vertices.length / 3;
        targetArray.vertices.push(
          edge.start.x, edge.start.y, edge.start.z,
          edge.end.x, edge.end.y, edge.end.z
        );
        targetArray.indices.push(baseIndex, baseIndex + 1);

        // Add to main geometry
        const mainBaseIndex = vertices.length / 3;
        vertices.push(
          edge.start.x, edge.start.y, edge.start.z,
          edge.end.x, edge.end.y, edge.end.z
        );
        indices.push(mainBaseIndex, mainBaseIndex + 1);

        // Add mirrored edge for boundary edges
        if (type === 'boundary') {
          const mirroredStart = new THREE.Vector3(-edge.start.x, edge.start.y, -edge.start.z);
          const mirroredEnd = new THREE.Vector3(-edge.end.x, edge.end.y, -edge.end.z);
          
          const mirroredBaseIndex = vertices.length / 3;
          vertices.push(
            mirroredStart.x, mirroredStart.y, mirroredStart.z,
            mirroredEnd.x, mirroredEnd.y, mirroredEnd.z
          );
          indices.push(mirroredBaseIndex, mirroredBaseIndex + 1);
        }
      }
    }

    const edgeGeometry = new THREE.BufferGeometry();
    edgeGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    edgeGeometry.setIndex(indices);

    if (this.sortEdges) {
      this.sortEdgesByY(edgeGeometry);
    }

    if (this.debugOptions.debug) {
      this.createDebugVisualization(edgesByType);
    }

    return edgeGeometry;
  }

  private processTriangleEdges(
    v1: THREE.Vector3,
    v2: THREE.Vector3,
    v3: THREE.Vector3,
    normal: THREE.Vector3
  ): void {
    this.addEdge(v1, v2, normal);
    this.addEdge(v2, v3, normal);
    this.addEdge(v3, v1, normal);
  }

  private addEdge(v1: THREE.Vector3, v2: THREE.Vector3, normal: THREE.Vector3): void {
    const key = this.getEdgeKey(v1, v2);
    const existingEdge = this.edges.get(key);

    if (existingEdge) {
      // This is a shared edge - store both face normals
      existingEdge.normal2 = normal.clone();
    } else {
      // This is a new edge
      this.edges.set(key, {
        start: v1.clone(),
        end: v2.clone(),
        normal1: normal.clone()
      });
    }
  }

  private shouldIncludeEdge(edge: Edge): boolean {
    if (!edge.normal2) {
      // Always include boundary edges
      return true;
    }

    if (!this.includeIntersectionEdges) {
      return false;
    }

    // Include edges where the angle between face normals exceeds the threshold
    const angle = edge.normal1.angleTo(edge.normal2);
    return angle > THREE.MathUtils.degToRad(this.angleThreshold);
  }

  private sortEdgesByY(geometry: THREE.BufferGeometry): void {
    const positions = geometry.getAttribute('position');
    const indices = geometry.getIndex();

    if (!indices) return;

    const edges: { y: number; indices: number[] }[] = [];

    // Group edges by average Y coordinate
    for (let i = 0; i < indices.count; i += 2) {
      const idx1 = indices.getX(i);
      const idx2 = indices.getX(i + 1);
      const y1 = positions.getY(idx1);
      const y2 = positions.getY(idx2);
      const avgY = (y1 + y2) / 2;

      edges.push({
        y: avgY,
        indices: [idx1, idx2]
      });
    }

    // Sort edges by Y coordinate
    edges.sort((a, b) => a.y - b.y);

    // Rebuild index buffer
    const newIndices = new Uint32Array(indices.count);
    let idx = 0;
    for (const edge of edges) {
      newIndices[idx++] = edge.indices[0];
      newIndices[idx++] = edge.indices[1];
    }

    geometry.setIndex(new THREE.BufferAttribute(newIndices, 1));
  }

  *generate(
    geometry: THREE.BufferGeometry | MeshBVH,
    options: { onProgress?: (percent: number) => void } = {}
  ): Generator<THREE.BufferGeometry, THREE.BufferGeometry, undefined> {
    const startTime = performance.now();
    const result = this.processEdges(geometry);

    if (options.onProgress) {
      options.onProgress(100);
    }

    yield result;
    return result;
  }

  async generateAsync(
    geometry: THREE.BufferGeometry | MeshBVH,
    options: {
      onProgress?: (percent: number) => void;
      signal?: AbortSignal;
    } = {}
  ): Promise<THREE.BufferGeometry> {
    return new Promise((resolve, reject) => {
      const generator = this.generate(geometry, options);
      const result = generator.next();
      
      if (options.signal) {
        options.signal.addEventListener('abort', () => {
          reject(new Error('Edge generation aborted'));
        });
      }

      resolve(result.value);
    });
  }

  private getEdgeType(edge: Edge): 'boundary' | 'intersection' | 'regular' {
    if (!edge.normal2) {
      return 'boundary';
    }
    
    const angle = edge.normal1.angleTo(edge.normal2);
    if (angle > THREE.MathUtils.degToRad(this.angleThreshold)) {
      return 'intersection';
    }
    
    return 'regular';
  }

  private createDebugVisualization(edgesByType: Record<'boundary' | 'intersection' | 'regular', { vertices: number[]; indices: number[] }>): void {
    // Clean up previous debug visualization
    if (this.debugVisualization) {
      Object.values(this.debugVisualization).forEach(obj => {
        if (obj && obj.geometry) {
          obj.geometry.dispose();
        }
      });
    }

    const debugVis: DebugVisualization = {
      edges: new THREE.LineSegments()
    };

    // Create separate line segments for each edge type
    for (const [type, data] of Object.entries(edgesByType) as [keyof typeof edgesByType, typeof edgesByType[keyof typeof edgesByType]][]) {
      if (data.vertices.length > 0) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
          'position',
          new THREE.Float32BufferAttribute(data.vertices, 3)
        );
        geometry.setIndex(data.indices);

        const material = new THREE.LineBasicMaterial({
          color: this.debugOptions.debugColors[type],
          linewidth: type === 'boundary' ? 2 : 1
        });

        const lines = new THREE.LineSegments(geometry, material);
        debugVis[`${type}Edges`] = lines;
      }
    }

    // Create visualization for normals if needed
    if (this.edges.size > 0) {
      const normalVertices: number[] = [];
      const normalIndices: number[] = [];
      let idx = 0;

      for (const edge of this.edges.values()) {
        const midpoint = new THREE.Vector3()
          .addVectors(edge.start, edge.end)
          .multiplyScalar(0.5);

        // Add normal1 visualization
        normalVertices.push(
          midpoint.x, midpoint.y, midpoint.z,
          midpoint.x + edge.normal1.x, midpoint.y + edge.normal1.y, midpoint.z + edge.normal1.z
        );
        normalIndices.push(idx, idx + 1);
        idx += 2;

        // Add normal2 visualization if it exists
        if (edge.normal2) {
          normalVertices.push(
            midpoint.x, midpoint.y, midpoint.z,
            midpoint.x + edge.normal2.x, midpoint.y + edge.normal2.y, midpoint.z + edge.normal2.z
          );
          normalIndices.push(idx, idx + 1);
          idx += 2;
        }
      }

      const normalGeometry = new THREE.BufferGeometry();
      normalGeometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(normalVertices, 3)
      );
      normalGeometry.setIndex(normalIndices);

      debugVis.normals = new THREE.LineSegments(
        normalGeometry,
        new THREE.LineBasicMaterial({
          color: this.debugOptions.debugColors.normals,
          linewidth: 1
        })
      );
    }

    this.debugVisualization = debugVis;
  }

  public getDebugVisualization(): DebugVisualization | null {
    return this.debugVisualization;
  }

  public exportEdges(): { start: THREE.Vector3; end: THREE.Vector3; type: 'boundary' | 'intersection' | 'regular' }[] {
    const exportedEdges: { start: THREE.Vector3; end: THREE.Vector3; type: 'boundary' | 'intersection' | 'regular' }[] = [];
    
    for (const edge of this.edges.values()) {
      if (this.shouldIncludeEdge(edge)) {
        const type = this.getEdgeType(edge);
        exportedEdges.push({
          start: edge.start.clone(),
          end: edge.end.clone(),
          type
        });

        // Add mirrored edge for boundary edges
        if (type === 'boundary') {
          exportedEdges.push({
            start: new THREE.Vector3(-edge.start.x, edge.start.y, -edge.start.z),
            end: new THREE.Vector3(-edge.end.x, edge.end.y, -edge.end.z),
            type
          });
        }
      }
    }

    return exportedEdges;
  }

  public toggleDebugVisualization(enable: boolean): void {
    this.debugOptions.debug = enable;
    if (!enable && this.debugVisualization) {
      Object.values(this.debugVisualization).forEach(obj => {
        if (obj && obj.geometry) {
          obj.geometry.dispose();
        }
      });
      this.debugVisualization = null;
    }
  }
} 