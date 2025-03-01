import { GroupTransform } from "@/types";
import { cloneClass } from "@/utils";

export type ShapeBoundingBox = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export interface Shape {
  id: string;
  type: 'polygon';
  points: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  
  getFill(): string;
  getStroke(): string;
  getBoundingBox(): ShapeBoundingBox;
  getCenter(): { x: number, y: number };
}

export interface PolygonShapeParams {
  id: string;
  top: number;
  left: number;
  sideLength: number;
  sides: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export class PolygonShape implements Shape {
  id: string;
  type: 'polygon' = 'polygon';
  points: string;
  fill: string;
  stroke: string;
  strokeWidth: number;

  constructor(params: PolygonShapeParams) {
    this.id = params.id;
    this.fill = params.fill || "#ff6347";
    this.stroke = params.stroke || "black";
    this.strokeWidth = params.strokeWidth || 1;
    
    // Generate polygon points based on the parameters
    this.points = this.generatePolygonPoints(
      params.top, 
      params.left, 
      params.sideLength, 
      params.sides
    );
  }

  private generatePolygonPoints(top: number, left: number, side_len: number, n_sides: number): string {
    // Calculate the radius of the circumscribed circle
    const radius = side_len / (2 * Math.sin(Math.PI / n_sides));
    
    // Calculate center of the polygon
    const centerX = left + radius;
    const centerY = top + radius;
    
    // Generate points for the regular polygon
    const points: string[] = [];
    
    for (let i = 0; i < n_sides; i++) {
      // Calculate angle for each vertex (starting from the top)
      const angle = (2 * Math.PI * i / n_sides) - (Math.PI / 2);
      
      // Calculate coordinates
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    }
    
    return points.join(' ');
  }

  getFill(): string {
    return `<polygon points="${this.points}" fill="${this.fill}" />`;
  }

  getStroke(): string {
    return `<polygon points="${this.points}" fill="none" stroke="${this.stroke}" stroke-width="${this.strokeWidth}" />`;
  }
    
  getBoundingBox(): ShapeBoundingBox {
    const pointPairs = this.points.split(' ');
    
    let minX = Number.MAX_VALUE;
    let maxX = Number.MIN_VALUE;
    let minY = Number.MAX_VALUE;
    let maxY = Number.MIN_VALUE;
    
    for (const pair of pointPairs) {
      const [x, y] = pair.split(',').map(Number);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    
    const width = maxX - minX;
    const height = maxY - minY;
    
    return { minX, minY, maxX, maxY, width, height };
  }

  getCenter(): { x: number, y: number } {
    const bbox = this.getBoundingBox();
    return {
      x: bbox.minX + (bbox.width / 2),
      y: bbox.minY + (bbox.height / 2)
    };
  }
}

export class ShapeTransform {
  originX: number;
  originY: number;
  scaleX: number;
  scaleY: number;

  constructor(originX: number = 0, originY: number = 0, scaleX: number = 1, scaleY: number = 1) {
    this.originX = originX;
    this.originY = originY;
    this.scaleX = scaleX;
    this.scaleY = scaleY;
  }

  updateTransform(groupTransform: GroupTransform | null): ShapeTransform {
    if (groupTransform) {
      this.scaleX = groupTransform.scaleX;
      this.scaleY = groupTransform.scaleY;
      this.originX = groupTransform.x;
      this.originY = groupTransform.y;
    } 
    return cloneClass(this);
  }
}
