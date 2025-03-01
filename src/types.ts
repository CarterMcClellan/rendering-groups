// Add the GroupTransform type
export type GroupTransform = {
  scaleX: number;
  scaleY: number;
  x: number;
  y: number;
} | null;

export type Position = {
  x: number;
  y: number;
}

export type Dimensions = {
  width: number;
  height: number;
}

export type Flipped = {
  x: boolean;
  y: boolean;
}

// Rename CurrentSelection to SelectedGroupProperties and remove selectedShapeIds
export type SelectedGroupProperties = {
  dimensions: Dimensions;
  fixedAnchor: Position;
  flipped: Flipped;
}