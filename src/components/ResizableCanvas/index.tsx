import { useState, useRef, useEffect } from 'react';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Constants
// ============================================================================

const CONSTANTS = {
  SVG_SIZE: 500,
  MIN_SIZE: 10,
  HANDLE_SIZE: { edge: 6, corner: 8 },
  ANCHOR_RADIUS: 5,
};

const INITIAL_POLYGONS: Polygon[] = [
  { points: "230,220 260,220 245,250", fill: "#ff6347", stroke: "black", strokeWidth: 1 },
  { points: "270,230 300,230 285,260", fill: "#4682b4", stroke: "black", strokeWidth: 1 },
  { points: "240,270 270,270 255,300", fill: "#9acd32", stroke: "black", strokeWidth: 1 }
];

const INITIAL_STATE = {
  fixedAnchor: { x: 150, y: 150 } as Point,
  dimensions: { width: 100, height: 100 } as Dimensions,
  baseDimensions: { width: 100, height: 100 } as Dimensions,
  flipped: { x: false, y: false },
};

const HANDLE_CONFIG: Record<HandleName, HandleConfig> = {
  'right': { cursor: 'ew-resize', isCorner: false, calc: (box) => ({ x: box.x + box.width, y: box.y + box.height / 2 }) },
  'bottom': { cursor: 'ns-resize', isCorner: false, calc: (box) => ({ x: box.x + box.width / 2, y: box.y + box.height }) },
  'left': { cursor: 'ew-resize', isCorner: false, calc: (box) => ({ x: box.x, y: box.y + box.height / 2 }) },
  'top': { cursor: 'ns-resize', isCorner: false, calc: (box) => ({ x: box.x + box.width / 2, y: box.y }) },
  'bottom-right': { cursor: 'nwse-resize', isCorner: true, calc: (box) => ({ x: box.x + box.width, y: box.y + box.height }) },
  'bottom-left': { cursor: 'nesw-resize', isCorner: true, calc: (box) => ({ x: box.x, y: box.y + box.height }) },
  'top-right': { cursor: 'nesw-resize', isCorner: true, calc: (box) => ({ x: box.x + box.width, y: box.y }) },
  'top-left': { cursor: 'nwse-resize', isCorner: true, calc: (box) => ({ x: box.x, y: box.y }) },
};

// ============================================================================
// Resize Transform Functions
// ============================================================================

const RESIZE_TRANSFORMS: Record<
  HandleName,
  (current: Dimensions, point: Point, fixed: Point, base: Dimensions) => ResizeTransform
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
  'left': (_current, point, fixed, base) => ({
    width: fixed.x + base.width - point.x,
    height: base.height,
    anchorX: point.x,
    anchorY: fixed.y,
  }),
  'top': (_current, point, fixed, base) => ({
    width: base.width,
    height: fixed.y + base.height - point.y,
    anchorX: fixed.x,
    anchorY: point.y,
  }),
  'bottom-right': (_current, point, fixed) => ({
    width: point.x - fixed.x,
    height: point.y - fixed.y,
    anchorX: fixed.x,
    anchorY: fixed.y,
  }),
  'bottom-left': (_current, point, fixed, base) => ({
    width: fixed.x + base.width - point.x,
    height: point.y - fixed.y,
    anchorX: point.x,
    anchorY: fixed.y,
  }),
  'top-right': (_current, point, fixed, base) => ({
    width: point.x - fixed.x,
    height: fixed.y + base.height - point.y,
    anchorX: fixed.x,
    anchorY: point.y,
  }),
  'top-left': (_current, point, fixed, base) => ({
    width: fixed.x + base.width - point.x,
    height: fixed.y + base.height - point.y,
    anchorX: point.x,
    anchorY: point.y,
  }),
};

// ============================================================================
// Utility Functions
// ============================================================================

const parsePoints = (pointsString: string): Point[] =>
  pointsString.split(' ').map(pair => {
    const [x, y] = pair.split(',').map(Number);
    return { x, y };
  });

const stringifyPoints = (pointsArray: Point[]): string =>
  pointsArray.map(p => `${p.x},${p.y}`).join(' ');

const clientToSVGCoords = (e: MouseEvent, svgRef: React.RefObject<SVGSVGElement>): Point => {
  const svgPoint = svgRef.current!.createSVGPoint();
  svgPoint.x = e.clientX;
  svgPoint.y = e.clientY;
  return svgPoint.matrixTransform(svgRef.current!.getScreenCTM()!.inverse());
};

const transformPoint = (
  point: Point,
  scaleX: number,
  scaleY: number,
  translateX: number,
  translateY: number
): Point => ({
  x: translateX + point.x * scaleX,
  y: translateY + point.y * scaleY,
});

const transformPolygons = (
  polygons: Polygon[],
  scaleX: number,
  scaleY: number,
  translateX: number,
  translateY: number
): Polygon[] =>
  polygons.map(polygon => ({
    ...polygon,
    points: stringifyPoints(
      parsePoints(polygon.points).map(p => transformPoint(p, scaleX, scaleY, translateX, translateY))
    )
  }));

const calculateBoundingBox = (polygonList: Polygon[]): BoundingBox => {
  const allPoints = polygonList.flatMap(polygon => parsePoints(polygon.points));
  const xs = allPoints.map(p => p.x);
  const ys = allPoints.map(p => p.y);

  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
};

const convertToLocalCoordinates = (polygons: Polygon[], bbox: BoundingBox): Polygon[] =>
  polygons.map(polygon => ({
    ...polygon,
    points: stringifyPoints(
      parsePoints(polygon.points).map(p => ({ x: p.x - bbox.x, y: p.y - bbox.y }))
    )
  }));

// ============================================================================
// Component
// ============================================================================

const ResizableCanvas = () => {
  // State
  const [fixedAnchor, setFixedAnchor] = useState<Point>(INITIAL_STATE.fixedAnchor);
  const [dimensions, setDimensions] = useState<Dimensions>(INITIAL_STATE.dimensions);
  const [baseDimensions, setBaseDimensions] = useState<Dimensions>(INITIAL_STATE.baseDimensions);
  const [flipped, setFlipped] = useState(INITIAL_STATE.flipped);
  const [isDragging, setIsDragging] = useState(false);
  const [activeHandle, setActiveHandle] = useState<HandleName | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [polygons, setPolygons] = useState<Polygon[]>(INITIAL_POLYGONS);
  const svgRef = useRef<SVGSVGElement>(null);
  const moveStartRef = useRef<{ pointer: Point; anchor: Point } | null>(null);
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const [selectionOrigin, setSelectionOrigin] = useState<Point | null>(null);
  const commitSelectionTransformRef = useRef<() => void>(() => {});
  const [translation, setTranslation] = useState<Point>({ x: 0, y: 0 });
  const resizeStartAnchorRef = useRef<Point | null>(null);

  // Calculate scale factors and bounding box
  const hasSelection = selectedIds.length > 0;
  const scaleX = hasSelection ? (flipped.x ? -1 : 1) * Math.abs(dimensions.width) / baseDimensions.width : 1;
  const scaleY = hasSelection ? (flipped.y ? -1 : 1) * Math.abs(dimensions.height) / baseDimensions.height : 1;
  const selectionLabel = hasSelection ? selectedIds.join(', ') : 'None';
  const widthLabel = hasSelection ? `${Math.abs(dimensions.width).toFixed(0)}px` : 'None';
  const heightLabel = hasSelection ? `${Math.abs(dimensions.height).toFixed(0)}px` : 'None';
  const scaleLabel = hasSelection ? `${Math.abs(scaleX).toFixed(2)}, ${Math.abs(scaleY).toFixed(2)}` : 'None';
  const flippedLabel = hasSelection ? `X: ${flipped.x ? 'Yes' : 'No'}, Y: ${flipped.y ? 'Yes' : 'No'}` : 'None';

  const boundingBox = {
    x: fixedAnchor.x + translation.x + (flipped.x ? dimensions.width : 0),
    y: fixedAnchor.y + translation.y + (flipped.y ? dimensions.height : 0),
    width: Math.abs(dimensions.width),
    height: Math.abs(dimensions.height),
  };

  // Reset to initial state
  const resetToInitial = () => {
    setPolygons(INITIAL_POLYGONS);
    setDimensions(INITIAL_STATE.dimensions);
    setBaseDimensions(INITIAL_STATE.baseDimensions);
    setFlipped(INITIAL_STATE.flipped);
    setFixedAnchor(INITIAL_STATE.fixedAnchor);
    setSelectedIds([]);
    setSelectionRect(null);
    setSelectionOrigin(null);
    setTranslation({ x: 0, y: 0 });
  };

  const setSelectionFromIds = (ids: number[]) => {
    if (!ids.length) {
      setSelectedIds([]);
      return;
    }
    const selectedPolygons = polygons.filter((_p, idx) => ids.includes(idx));
    const bbox = calculateBoundingBox(selectedPolygons);
    setSelectedIds(ids);
    setFixedAnchor({ x: bbox.x, y: bbox.y });
    setDimensions({ width: bbox.width, height: bbox.height });
    setBaseDimensions({ width: bbox.width, height: bbox.height });
    setFlipped({ x: false, y: false });
    setSelectionOrigin({ x: bbox.x, y: bbox.y });
    setTranslation({ x: 0, y: 0 });
  };

  const commitSelectionTransform = () => {
    if (!hasSelection) return;
    const origin = selectionOrigin ?? fixedAnchor;
    const target = fixedAnchor;
    const transformedPolygons = polygons.map((polygon, idx) => {
      if (!selectedIds.includes(idx)) return polygon;
      const points = parsePoints(polygon.points).map(p => {
        const localX = p.x - origin.x;
        const localY = p.y - origin.y;
        return {
          x: target.x + translation.x + localX * scaleX,
          y: target.y + translation.y + localY * scaleY,
        };
      });
      return { ...polygon, points: stringifyPoints(points) };
    });

    const selectedPolygons = transformedPolygons.filter((_p, idx) => selectedIds.includes(idx));
    const bbox = calculateBoundingBox(selectedPolygons);

    setPolygons(transformedPolygons);
    const nextAnchor = { x: bbox.x, y: bbox.y };
    setFixedAnchor(nextAnchor);
    setDimensions({ width: bbox.width, height: bbox.height });
    setBaseDimensions({ width: bbox.width, height: bbox.height });
    setFlipped({ x: false, y: false });
    setSelectionOrigin(nextAnchor);
    setTranslation({ x: 0, y: 0 });
  };

  useEffect(() => {
    commitSelectionTransformRef.current = commitSelectionTransform;
  }, [commitSelectionTransform]);

  // Helper function to remap handles based on flip state
  const getEffectiveHandle = (handle: HandleName, flipped: { x: boolean; y: boolean }): HandleName => {
    const handleMap: Record<HandleName, HandleName> = {
      'top': flipped.y ? 'bottom' : 'top',
      'bottom': flipped.y ? 'top' : 'bottom',
      'left': flipped.x ? 'right' : 'left',
      'right': flipped.x ? 'left' : 'right',
      'top-left': (flipped.y && flipped.x) ? 'bottom-right' :
                   flipped.y ? 'bottom-left' :
                   flipped.x ? 'top-right' : 'top-left',
      'top-right': (flipped.y && flipped.x) ? 'bottom-left' :
                    flipped.y ? 'bottom-right' :
                    flipped.x ? 'top-left' : 'top-right',
      'bottom-left': (flipped.y && flipped.x) ? 'top-right' :
                      flipped.y ? 'top-left' :
                      flipped.x ? 'bottom-right' : 'bottom-left',
      'bottom-right': (flipped.y && flipped.x) ? 'top-left' :
                       flipped.y ? 'top-right' :
                       flipped.x ? 'bottom-left' : 'bottom-right',
    };

    return handleMap[handle];
  };

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent, handle: HandleName) => {
    e.stopPropagation();
    if (translation.x !== 0 || translation.y !== 0) {
      commitSelectionTransformRef.current();
    }
    resizeStartAnchorRef.current = fixedAnchor;
    setIsDragging(true);
    setActiveHandle(handle);
  };

  const handleResize = (e: MouseEvent) => {
    if (!isDragging || !activeHandle || !resizeStartAnchorRef.current) return;

    const point = clientToSVGCoords(e, svgRef);

    // Use the original anchor from when drag started
    const startAnchor = resizeStartAnchorRef.current;
    const transform = RESIZE_TRANSFORMS[activeHandle](dimensions, point, startAnchor, baseDimensions);

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
    resizeStartAnchorRef.current = null;
    commitSelectionTransformRef.current();
  };

  // Move handlers
  const handleMoveStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    const point = clientToSVGCoords(e.nativeEvent, svgRef);
    moveStartRef.current = { pointer: point, anchor: fixedAnchor };
    setIsMoving(true);
  };

  const handleMove = (e: MouseEvent) => {
    if (!isMoving || !moveStartRef.current) return;
    const point = clientToSVGCoords(e, svgRef);
    const deltaX = point.x - moveStartRef.current.pointer.x;
    const deltaY = point.y - moveStartRef.current.pointer.y;
    setTranslation({ x: deltaX, y: deltaY });
  };

  const handleMoveEnd = () => {
    setIsMoving(false);
    moveStartRef.current = null;
    commitSelectionTransformRef.current();
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
  }, [isDragging, handleResize, handleResizeEnd, activeHandle, dimensions, fixedAnchor, flipped]);

  useEffect(() => {
    if (isMoving) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleMoveEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleMoveEnd);
    };
  }, [isMoving, handleMove, handleMoveEnd]);

  const handlePositions = Object.fromEntries(
    Object.entries(HANDLE_CONFIG).map(([handle, config]) => [handle, config.calc(boundingBox)])
  ) as Record<HandleName, Point>;

  // Selection rectangle helpers
  const handleSvgMouseDown = (e: React.MouseEvent) => {
    if (isDragging || isMoving) return;
    // If already dragging a handle or move, ignore
    if (hasSelection) {
      // Clicking on empty space should start a new selection and clear existing
      setSelectedIds([]);
    }

    const point = clientToSVGCoords(e.nativeEvent, svgRef);
    setTranslation({ x: 0, y: 0 });
    setSelectionRect({ start: point, current: point });
  };

  const handleSvgMouseMove = (e: React.MouseEvent) => {
    if (!selectionRect) return;
    const point = clientToSVGCoords(e.nativeEvent, svgRef);
    setSelectionRect(prev => prev ? { ...prev, current: point } : prev);
  };

  const rectsIntersect = (a: BoundingBox, b: BoundingBox) => {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  };

  const handleSvgMouseUp = () => {
    if (!selectionRect) return;
    const x1 = selectionRect.start.x;
    const y1 = selectionRect.start.y;
    const x2 = selectionRect.current.x;
    const y2 = selectionRect.current.y;
    const selBox: BoundingBox = {
      x: Math.min(x1, x2),
      y: Math.min(y1, y2),
      width: Math.abs(x2 - x1),
      height: Math.abs(y2 - y1),
    };

    const intersectingIds = polygons
      .map((polygon, idx) => ({ idx, bbox: calculateBoundingBox([polygon]) }))
      .filter(({ bbox }) => rectsIntersect(selBox, bbox))
      .map(({ idx }) => idx);

    setSelectionRect(null);
    setSelectionFromIds(intersectingIds);
  };

  const handlePolygonMouseDown = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (hasSelection && selectedIds.includes(index)) {
      handleMoveStart(e);
      return;
    }
    setSelectionFromIds([index]);
  };

  return (
    <div className="flex flex-col items-center p-8">
      <div className="mb-4">
        <p className="text-lg font-semibold">Click to select, drag a marquee to multi-select, drag inside box to move, or drag any handle to resize/flip</p>
        <p>Selection: {selectionLabel}</p>
        <p>Width/Height: {widthLabel}, {heightLabel}</p>
        <p>Scale X/Y: {scaleLabel}</p>
        <p>Flipped: {flippedLabel}</p>
      </div>

      <svg
        ref={svgRef}
        width={CONSTANTS.SVG_SIZE}
        height={CONSTANTS.SVG_SIZE}
        className="border border-gray-300 bg-gray-50"
        onMouseDown={(e) => {
          // if selection exists but click starts on handle or inside rect, handlers already attached
          // selection rectangle should start only when not caught elsewhere
          handleSvgMouseDown(e);
        }}
        onMouseMove={handleSvgMouseMove}
        onMouseUp={handleSvgMouseUp}
      >
        {hasSelection ? (
          <>
            {polygons.map((polygon, index) => {
              const isSelected = selectedIds.includes(index);
              const points = isSelected
                ? stringifyPoints(
                    parsePoints(polygon.points).map(p => {
                      const origin = selectionOrigin ?? fixedAnchor;
                      return {
                        x: fixedAnchor.x + translation.x + (p.x - origin.x) * scaleX,
                        y: fixedAnchor.y + translation.y + (p.y - origin.y) * scaleY,
                      };
                    })
                  )
                : polygon.points;
              return (
                <polygon
                  key={index}
                  points={points}
                  fill={polygon.fill}
                  stroke={polygon.stroke}
                  strokeWidth={polygon.strokeWidth}
                  onMouseDown={(e) => handlePolygonMouseDown(e, index)}
                />
              );
            })}

            <rect
              x={boundingBox.x}
              y={boundingBox.y}
              width={boundingBox.width}
              height={boundingBox.height}
              fill="transparent"
              stroke="#3b82f6"
              strokeWidth="1"
              strokeDasharray="4"
              cursor="move"
              onMouseDown={handleMoveStart}
            />

            {(Object.entries(handlePositions) as [HandleName, Point][]).map(([handle, pos]) => {
              const config = HANDLE_CONFIG[handle];
              const effectiveHandle = getEffectiveHandle(handle, flipped);
              const isFixedAnchor = effectiveHandle === 'top-left';
              return (
                <circle
                  key={handle}
                  data-testid={`resize-handle-${handle}`}
                  data-is-fixed-anchor={isFixedAnchor}
                  cx={pos.x}
                  cy={pos.y}
                  r={config.isCorner ? CONSTANTS.HANDLE_SIZE.corner : CONSTANTS.HANDLE_SIZE.edge}
                  fill="#3b82f6"
                  stroke="white"
                  strokeWidth="2"
                  cursor={config.cursor}
                  onMouseDown={(e) => handleResizeStart(e, handle)}
                />
              );
            })}
          </>
        ) : (
          polygons.map((polygon, index) => (
            <polygon
              key={index}
              points={polygon.points}
              fill={polygon.fill}
              stroke={polygon.stroke}
              strokeWidth={polygon.strokeWidth}
              onMouseDown={(e) => handlePolygonMouseDown(e, index)}
            />
          ))
        )}

        {selectionRect && (
          <rect
            x={Math.min(selectionRect.start.x, selectionRect.current.x)}
            y={Math.min(selectionRect.start.y, selectionRect.current.y)}
            width={Math.abs(selectionRect.current.x - selectionRect.start.x)}
            height={Math.abs(selectionRect.current.y - selectionRect.start.y)}
            fill="rgba(59, 130, 246, 0.1)"
            stroke="#3b82f6"
            strokeWidth="1"
            strokeDasharray="4"
          />
        )}
      </svg>
      <div className="mt-4 flex gap-2">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={resetToInitial}
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default ResizableCanvas;
