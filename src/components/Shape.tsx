export interface Shape {
  id: string;
  type: 'polygon';
  points: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
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
}