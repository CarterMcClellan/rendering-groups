import type { Point, Dimensions, Polygon, HandleName, HandleConfig } from '../types/canvas.types';

export const CONSTANTS = {
  SVG_SIZE: 500,
  MIN_SIZE: 10,
  HANDLE_SIZE: { edge: 6, corner: 8 },
  ANCHOR_RADIUS: 5,
};

export const INITIAL_POLYGONS: Polygon[] = [
  { points: "0,0 30,0 15,30", fill: "#ff6347", stroke: "black", strokeWidth: 1 },
  { points: "40,10 70,10 55,40", fill: "#4682b4", stroke: "black", strokeWidth: 1 },
  { points: "20,50 50,50 35,80", fill: "#9acd32", stroke: "black", strokeWidth: 1 }
];

export const INITIAL_STATE = {
  fixedAnchor: { x: 150, y: 150 } as Point,
  dimensions: { width: 100, height: 100 } as Dimensions,
  baseDimensions: { width: 100, height: 100 } as Dimensions,
  flipped: { x: false, y: false },
};

export const HANDLE_CONFIG: Record<HandleName, HandleConfig> = {
  'right': { cursor: 'ew-resize', isCorner: false, calc: (box) => ({ x: box.x + box.width, y: box.y + box.height / 2 }) },
  'bottom': { cursor: 'ns-resize', isCorner: false, calc: (box) => ({ x: box.x + box.width / 2, y: box.y + box.height }) },
  'left': { cursor: 'ew-resize', isCorner: false, calc: (box) => ({ x: box.x, y: box.y + box.height / 2 }) },
  'top': { cursor: 'ns-resize', isCorner: false, calc: (box) => ({ x: box.x + box.width / 2, y: box.y }) },
  'bottom-right': { cursor: 'nwse-resize', isCorner: true, calc: (box) => ({ x: box.x + box.width, y: box.y + box.height }) },
  'bottom-left': { cursor: 'nesw-resize', isCorner: true, calc: (box) => ({ x: box.x, y: box.y + box.height }) },
  'top-right': { cursor: 'nesw-resize', isCorner: true, calc: (box) => ({ x: box.x + box.width, y: box.y }) },
  'top-left': { cursor: 'nwse-resize', isCorner: true, calc: (box) => ({ x: box.x, y: box.y }) },
};
