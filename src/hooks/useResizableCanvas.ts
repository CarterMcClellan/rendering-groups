import { useState, useRef, useEffect } from 'react';
import type { Point, Dimensions, Polygon, HandleName } from '../types/canvas.types';
import { INITIAL_STATE, INITIAL_POLYGONS, CONSTANTS } from '../constants/canvas.constants';
import { RESIZE_TRANSFORMS } from '../config/resizeTransforms';
import { clientToSVGCoords, transformPolygons, calculateBoundingBox, convertToLocalCoordinates } from '../utils/canvas.utils';

export const useResizableCanvas = () => {
  const [fixedAnchor, setFixedAnchor] = useState<Point>(INITIAL_STATE.fixedAnchor);
  const [dimensions, setDimensions] = useState<Dimensions>(INITIAL_STATE.dimensions);
  const [baseDimensions, setBaseDimensions] = useState<Dimensions>(INITIAL_STATE.baseDimensions);
  const [flipped, setFlipped] = useState(INITIAL_STATE.flipped);
  const [isDragging, setIsDragging] = useState(false);
  const [activeHandle, setActiveHandle] = useState<HandleName | null>(null);
  const [isGrouped, setIsGrouped] = useState(true);
  const [polygons, setPolygons] = useState<Polygon[]>(INITIAL_POLYGONS);
  const svgRef = useRef<SVGSVGElement>(null);

  // Calculate scale factors and bounding box
  const scaleX = (flipped.x ? -1 : 1) * Math.abs(dimensions.width) / baseDimensions.width;
  const scaleY = (flipped.y ? -1 : 1) * Math.abs(dimensions.height) / baseDimensions.height;

  const boundingBox = {
    x: fixedAnchor.x + (flipped.x ? dimensions.width : 0),
    y: fixedAnchor.y + (flipped.y ? dimensions.height : 0),
    width: Math.abs(dimensions.width),
    height: Math.abs(dimensions.height),
  };

  // Apply group transform to individual polygons and reset to identity
  const applyGroupTransform = () => {
    const transformed = transformPolygons(polygons, scaleX, scaleY, fixedAnchor.x, fixedAnchor.y);
    const bbox = calculateBoundingBox(transformed);

    setPolygons(transformed);
    setFixedAnchor({ x: bbox.x, y: bbox.y });
    setDimensions({ width: bbox.width, height: bbox.height });
    setBaseDimensions({ width: bbox.width, height: bbox.height });
    setFlipped({ x: false, y: false });
    setIsGrouped(false);
  };

  // Convert absolute positioned polygons to grouped local coordinates
  const regroupElements = () => {
    const bbox = calculateBoundingBox(polygons);
    const localPolygons = convertToLocalCoordinates(polygons, bbox);

    setPolygons(localPolygons);
    setFixedAnchor({ x: bbox.x, y: bbox.y });
    setDimensions({ width: bbox.width, height: bbox.height });
    setBaseDimensions({ width: bbox.width, height: bbox.height });
    setFlipped({ x: false, y: false });
    setIsGrouped(true);
  };

  // Reset to initial state
  const resetToInitial = () => {
    setPolygons(INITIAL_POLYGONS);
    setDimensions(INITIAL_STATE.dimensions);
    setBaseDimensions(INITIAL_STATE.baseDimensions);
    setFlipped(INITIAL_STATE.flipped);
    setFixedAnchor(INITIAL_STATE.fixedAnchor);
    setIsGrouped(true);
  };

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent, handle: HandleName) => {
    e.stopPropagation();
    setIsDragging(true);
    setActiveHandle(handle);
  };

  const handleResize = (e: MouseEvent) => {
    if (!isDragging || !activeHandle) return;

    const point = clientToSVGCoords(e, svgRef);
    const transform = RESIZE_TRANSFORMS[activeHandle](dimensions, point, fixedAnchor);

    const shouldFlipX = transform.width < 0;
    const shouldFlipY = transform.height < 0;

    const absWidth = Math.max(CONSTANTS.MIN_SIZE, Math.abs(transform.width));
    const absHeight = Math.max(CONSTANTS.MIN_SIZE, Math.abs(transform.height));

    setFlipped({ x: shouldFlipX, y: shouldFlipY });
    setDimensions({
      width: shouldFlipX ? -absWidth : absWidth,
      height: shouldFlipY ? -absHeight : absHeight
    });
    setFixedAnchor({ x: transform.anchorX, y: transform.anchorY });
  };

  const handleResizeEnd = () => {
    setIsDragging(false);
    setActiveHandle(null);
  };

  // Attach event listeners for dragging outside the SVG
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleResize);
      window.addEventListener('mouseup', handleResizeEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleResize);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isDragging]);

  return {
    // State
    svgRef,
    fixedAnchor,
    dimensions,
    scaleX,
    scaleY,
    flipped,
    isGrouped,
    polygons,
    boundingBox,

    // Handlers
    handleResizeStart,
    applyGroupTransform,
    regroupElements,
    resetToInitial,
  };
};
