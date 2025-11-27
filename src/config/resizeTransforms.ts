import type { HandleName, Dimensions, Point, ResizeTransform } from '../types/canvas.types';

export const RESIZE_TRANSFORMS: Record<
  HandleName,
  (current: Dimensions, point: Point, fixed: Point) => ResizeTransform
> = {
  'right': (current, point, fixed) => ({
    width: point.x - fixed.x,
    height: current.height,
    anchorX: fixed.x,
    anchorY: fixed.y,
  }),
  'bottom': (current, point, fixed) => ({
    width: current.width,
    height: point.y - fixed.y,
    anchorX: fixed.x,
    anchorY: fixed.y,
  }),
  'left': (current, point, fixed) => ({
    width: fixed.x + current.width - point.x,
    height: current.height,
    anchorX: point.x,
    anchorY: fixed.y,
  }),
  'top': (current, point, fixed) => ({
    width: current.width,
    height: fixed.y + current.height - point.y,
    anchorX: fixed.x,
    anchorY: point.y,
  }),
  'bottom-right': (_current, point, fixed) => ({
    width: point.x - fixed.x,
    height: point.y - fixed.y,
    anchorX: fixed.x,
    anchorY: fixed.y,
  }),
  'bottom-left': (current, point, fixed) => ({
    width: fixed.x + current.width - point.x,
    height: point.y - fixed.y,
    anchorX: point.x,
    anchorY: fixed.y,
  }),
  'top-right': (current, point, fixed) => ({
    width: point.x - fixed.x,
    height: fixed.y + current.height - point.y,
    anchorX: fixed.x,
    anchorY: point.y,
  }),
  'top-left': (current, point, fixed) => ({
    width: fixed.x + current.width - point.x,
    height: fixed.y + current.height - point.y,
    anchorX: point.x,
    anchorY: point.y,
  }),
};
