export interface Point {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface BoundingBox extends Point, Dimensions {}

export interface Polygon {
  points: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface Guideline {
  type: 'vertical' | 'horizontal';
  pos: number;
  start: number;
  end: number;
}

export interface ResizeTransform {
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
}

export interface SelectionRect {
  start: Point;
  current: Point;
}

export type HandleName =
  | 'right'
  | 'bottom'
  | 'left'
  | 'top'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-right'
  | 'top-left';

export interface HandleConfig {
  cursor: string;
  isCorner: boolean;
  calc: (box: BoundingBox) => Point;
}
