import { Flipped, GroupTransform, Scale } from "@/types";
import { cloneClass } from "@/utils";

export type CartesianPosition = {
  x: number;
  y: number;
}

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
  position: CartesianPosition;
  scale: Scale;
  fill: string;
  stroke: string;
  strokeWidth: number;
  
  getFill(): string;
  getStroke(): string;
  getTransformStr(): string;
  getBoundingBox(): ShapeBoundingBox;
  getCenter(): { x: number, y: number };
  update(groupT: GroupTransform): Shape;
}

export interface PolygonShapeParams {
  id: string;
  sideLength: number;
  sides: number;
  x: number;
  y: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  scale?: Scale;
  flipped?: Flipped;
}

export class PolygonShape implements Shape {
  id: string;
  type: 'polygon' = 'polygon';
  points: string;
  position: CartesianPosition;
  initialPosition: CartesianPosition;
  scale: Scale;
  initialFlip: Flipped;
  flipped: Flipped;
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
      params.sideLength, 
      params.sides
    );

    this.position = {
      x: params.x,
      y: params.y
    };

    this.initialPosition = {
      x: params.x,
      y: params.y
    }

    this.scale = params.scale || { x: 1, y: 1};
    this.flipped = params.flipped || { x: 1, y: 1};
    this.initialFlip = params.flipped || { x: 1, y: 1};
  }

  private generatePolygonPoints(side_len: number, n_sides: number): string {
    // Calculate the radius of the circumscribed circle
    const radius = side_len / (2 * Math.sin(Math.PI / n_sides));
    
    // Calculate center of the polygon
    const centerX = radius;
    const centerY = radius;
    
    // Generate points for the regular polygon
    const points: string[] = [];
    
    for (let i = 0; i < n_sides; i++) {
      // Calculate angle for each vertex (starting from the top)
      const angle = (2 * Math.PI * i / n_sides) - (Math.PI / 2);
      
      // Calculate coordinates
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
      // points.push(`${x},${y}`);
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
      minX = Math.min(minX, x + this.position.x);
      maxX = Math.max(maxX, x + this.position.x);
      minY = Math.min(minY, y + this.position.y);
      maxY = Math.max(maxY, y + this.position.y);
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

  getTransformStr(): string {
    return `translate(${this.position.x}, ${this.position.y}) scale(${this.flipped.x*this.scale.x}, ${this.flipped.y*this.scale.y})`
  }

  update(groupT: GroupTransform): PolygonShape{
    this.position = { 
      x: this.initialPosition.x + groupT.position.x, 
      y: this.initialPosition.y + groupT.position.y 
    };
    this.scale = groupT.scale;
    if (groupT.flipped.x == -1) {
      this.flipped.x = this.initialFlip.x * -1;
    } 
    if(groupT.flipped.y == -1) {
      this.flipped.y = this.initialFlip.y * -1;
    }
    return cloneClass(this);
  }
}