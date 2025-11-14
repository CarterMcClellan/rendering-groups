import { ShapeBoundingBox } from "./components/Shape";

export const computeDimensionsFromBoundingBoxes = (boundingBoxes: Array<ShapeBoundingBox>) => {
  if (boundingBoxes.length === 0) return null;
  
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  boundingBoxes.forEach(bbox => {
    minX = Math.min(minX, bbox.minX);
    minY = Math.min(minY, bbox.minY);
    maxX = Math.max(maxX, bbox.maxX);
    maxY = Math.max(maxY, bbox.maxY);
  });

  return {
    dimensions: { width: maxX - minX, height: maxY - minY },
    fixedAnchor: { x: minX, y: minY }
  };
};

// Create a deep clone of an object that includes all methods
//  We use this a lot for re-rendering
//  Zustand hooks will not fire unless the memory address of an object changes 
export function cloneClass<T extends object>(obj: T): T {
  const clone = Object.create(Object.getPrototypeOf(obj));
  const propsOnly = structuredClone(obj);
  return Object.assign(clone, propsOnly);
}