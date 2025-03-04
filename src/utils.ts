import { Dimensions, Position } from "./types";
import { Handle } from "./types";

export const getBoundingBox = (groupDimensions: Dimensions, groupPosition: Position): Record<Handle, Position> => {
  const { w, h } = groupDimensions;
  const { x, y } = groupPosition;
  const hw = w / 2;
  const hh = h / 2;

  return {
    [Handle.TOP_LEFT]: { x: x, y: y},
    [Handle.TOP_RIGHT]: { x: x + w, y: y},
    [Handle.BOTTOM_LEFT]: { x: x, y: y + h},
    [Handle.BOTTOM_RIGHT]: { x: x + w, y: y + h},
    [Handle.TOP]: { x: x + hw, y: y},
    [Handle.BOTTOM]: { x: x + hw, y: y + h},
    [Handle.LEFT]: { x, y: y + hh},
    [Handle.RIGHT]: { x: x + w, y: y + hh}
  }
}

export const getHandleCursor = (handle: Handle): string => {
  switch (handle) {
    case Handle.TOP_LEFT:
      return 'nwse-resize';
    case Handle.BOTTOM_RIGHT:
      return 'nwse-resize';
    case Handle.TOP_RIGHT:
      return 'nesw-resize';
    case Handle.BOTTOM_LEFT:
      return 'nesw-resize';
    case Handle.TOP:
      return 'ns-resize';
    case Handle.BOTTOM:
      return 'ns-resize';
    case Handle.LEFT:
      return 'ew-resize';
    case Handle.RIGHT:
      return 'ew-resize';
    default:
      return 'pointer';
  }
}