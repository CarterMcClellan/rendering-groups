// Add the GroupTransform type
export type GroupTransform = {
  scale: Scale;
  position: Position;
  flipped: Flipped;
};

export type Scale = {
  x: number;
  y: number;
}

export type Position = {
  x: number;
  y: number;
}

export type Dimensions = {
  width: number;
  height: number;
}

export type Flipped = {
  x: number; // -1 or 1 (-1 represents flipped)
  y: number;
}

// Rename CurrentSelection to SelectedGroupProperties and remove selectedShapeIds
export type SelectedGroupProperties = {
  dimensions: Dimensions;
  fixedAnchor: Position;
  flipped: Flipped;
}