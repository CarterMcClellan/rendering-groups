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
  { points: "0,0 30,0 15,30", fill: "#ff6347", stroke: "black", strokeWidth: 1 },
  { points: "40,10 70,10 55,40", fill: "#4682b4", stroke: "black", strokeWidth: 1 },
  { points: "20,50 50,50 35,80", fill: "#9acd32", stroke: "black", strokeWidth: 1 }
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
    setIsDragging(true);
    setActiveHandle(handle);
  };

  const handleResize = (e: MouseEvent) => {
    if (!isDragging || !activeHandle) return;

    const point = clientToSVGCoords(e, svgRef);

    // if flipped get a diff handle
    const effectiveHandle = getEffectiveHandle(activeHandle, flipped);
    const transform = RESIZE_TRANSFORMS[effectiveHandle](dimensions, point, fixedAnchor);

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

  const handlePositions = Object.fromEntries(
    Object.entries(HANDLE_CONFIG).map(([handle, config]) => [handle, config.calc(boundingBox)])
  ) as Record<HandleName, Point>;

  return (
    <div className="flex flex-col items-center p-8">
      <div className="mb-4">
        <p className="text-lg font-semibold">Drag any handle to resize or flip the shapes</p>
        <p>Width: {Math.abs(dimensions.width).toFixed(0)}px, Height: {Math.abs(dimensions.height).toFixed(0)}px</p>
        <p>Scale X: {Math.abs(scaleX).toFixed(2)}, Scale Y: {Math.abs(scaleY).toFixed(2)}</p>
        <p>Flipped X: {flipped.x ? 'Yes' : 'No'}, Flipped Y: {flipped.y ? 'Yes' : 'No'}</p>
      </div>

      <svg
        ref={svgRef}
        width={CONSTANTS.SVG_SIZE}
        height={CONSTANTS.SVG_SIZE}
        className="border border-gray-300 bg-gray-50"
      >
        {isGrouped ? (
          <>
            <g transform={`translate(${fixedAnchor.x}, ${fixedAnchor.y}) scale(${scaleX}, ${scaleY})`}>
              {polygons.map((polygon, index) => (
                <polygon
                  key={index}
                  points={polygon.points}
                  fill={polygon.fill}
                  stroke={polygon.stroke}
                  strokeWidth={polygon.strokeWidth}
                />
              ))}
            </g>

            <rect
              x={boundingBox.x}
              y={boundingBox.y}
              width={boundingBox.width}
              height={boundingBox.height}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1"
              strokeDasharray="4"
            />

            {(Object.entries(handlePositions) as [HandleName, Point][]).map(([handle, pos]) => {
              const config = HANDLE_CONFIG[handle];
              return (
                <circle
                  key={handle}
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
            />
          ))
        )}
      </svg>

      <div className="mt-4 flex gap-2">
        {isGrouped ? (
          <button
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            onClick={applyGroupTransform}
          >
            Apply Group Transform
          </button>
        ) : (
          <button
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            onClick={regroupElements}
          >
            Re-group Elements
          </button>
        )}
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
