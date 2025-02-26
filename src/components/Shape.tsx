export interface Shape {
  id: string;
  type: 'polygon';
  points: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  
  getFill(): string;
  getStroke(): string;
}

export class PolygonShape implements Shape {
  id: string;
  type: 'polygon' = 'polygon';
  points: string;
  fill: string;
  stroke: string;
  strokeWidth: number;

  constructor(id: string, points: string, fill: string, stroke: string, strokeWidth: number) {
    this.id = id;
    this.points = points;
    this.fill = fill;
    this.stroke = stroke;
    this.strokeWidth = strokeWidth;
  }

  getFill(): string {
    return `<polygon points="${this.points}" fill="${this.fill}" />`;
  }

  getStroke(): string {
    return `<polygon points="${this.points}" fill="none" stroke="${this.stroke}" stroke-width="${this.strokeWidth}" />`;
  }
}
