import { useState, useRef, useEffect } from 'react';
import { calculateSnap } from './snapLogic';
import {
  Point,
  Dimensions,
  BoundingBox,
  Polygon,
  ResizeTransform,
  SelectionRect,
  HandleName,
  HandleConfig,
  Guideline
} from './types';

// ============================================================================
// Constants
// ============================================================================

const CONSTANTS = {
  // SVG_SIZE: 500,
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  MIN_SIZE: 10,
  HANDLE_SIZE: { edge: 6, corner: 8 },
  ANCHOR_RADIUS: 5,
  SNAP_THRESHOLD: 5,
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
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const moveStartRef = useRef<{ pointer: Point; anchor: Point } | null>(null);
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const [selectionOrigin, setSelectionOrigin] = useState<Point | null>(null);
  const commitSelectionTransformRef = useRef<() => void>(() => {});
  const [translation, setTranslation] = useState<Point>({ x: 0, y: 0 });
  const resizeStartAnchorRef = useRef<Point | null>(null);
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [previewBBox, setPreviewBBox] = useState<BoundingBox | null>(null);

  // Chat Tab State
  const [activeTab, setActiveTab] = useState<'design' | 'chat'>('design');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: "Hello! I'm your design assistant. How can I help you today?" },
  ]);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setActiveTab((prev) => (prev === 'design' ? 'chat' : 'design'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Calculate scale factors and bounding box
  const hasSelection = selectedIds.length > 0;
  const scaleX = hasSelection ? (flipped.x ? -1 : 1) * Math.abs(dimensions.width) / baseDimensions.width : 1;
  const scaleY = hasSelection ? (flipped.y ? -1 : 1) * Math.abs(dimensions.height) / baseDimensions.height : 1;

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
    setGuidelines([]);
    setPreviewBBox(null);
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
    setGuidelines([]);
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
    setGuidelines([]);
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
    setHoveredId(null);
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
    setHoveredId(null);
  };

  const handleMove = (e: MouseEvent) => {
    if (!isMoving || !moveStartRef.current) return;
    const point = clientToSVGCoords(e, svgRef);
    let deltaX = point.x - moveStartRef.current.pointer.x;
    let deltaY = point.y - moveStartRef.current.pointer.y;

    // --- SNAPPING LOGIC START ---
    const proposedBox = {
      x: fixedAnchor.x + deltaX + (flipped.x ? dimensions.width : 0),
      y: fixedAnchor.y + deltaY + (flipped.y ? dimensions.height : 0),
      width: Math.abs(dimensions.width),
      height: Math.abs(dimensions.height),
    };

    const snapResult = calculateSnap(
      proposedBox,
      polygons,
      selectedIds,
      CONSTANTS.CANVAS_WIDTH,
      CONSTANTS.CANVAS_HEIGHT,
      CONSTANTS.SNAP_THRESHOLD
    );
    
    setGuidelines(snapResult.guidelines);
    deltaX += snapResult.translation.x;
    deltaY += snapResult.translation.y;

    // --- SNAPPING LOGIC END ---

    setTranslation({ x: deltaX, y: deltaY });
  };

  const handleMoveEnd = () => {
    setIsMoving(false);
    moveStartRef.current = null;
    setGuidelines([]);
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
      setGuidelines([]);
    }

    const point = clientToSVGCoords(e.nativeEvent, svgRef);
    setTranslation({ x: 0, y: 0 });
    setSelectionRect({ start: point, current: point });
    setHoveredId(null);
  };

  const rectsIntersect = (a: BoundingBox, b: BoundingBox) => {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  };

  const handleSvgMouseMove = (e: React.MouseEvent) => {
    if (!selectionRect) return;
    const point = clientToSVGCoords(e.nativeEvent, svgRef);
    setSelectionRect(prev => prev ? { ...prev, current: point } : prev);

    // Preview selection
    const x1 = selectionRect.start.x;
    const y1 = selectionRect.start.y;
    const x2 = point.x;
    const y2 = point.y;
    const selBox: BoundingBox = {
      x: Math.min(x1, x2),
      y: Math.min(y1, y2),
      width: Math.abs(x2 - x1),
      height: Math.abs(y2 - y1),
    };

    const intersectingPolygons = polygons
      .filter((polygon) => {
         const bbox = calculateBoundingBox([polygon]);
         return rectsIntersect(selBox, bbox);
      });

    if (intersectingPolygons.length > 0) {
        setPreviewBBox(calculateBoundingBox(intersectingPolygons));
    } else {
        setPreviewBBox(null);
    }
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
    setPreviewBBox(null);
    setSelectionFromIds(intersectingIds);
  };

  const handlePolygonMouseDown = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setHoveredId(null);

    if (hasSelection && selectedIds.includes(index)) {
      // Already selected, just start moving
      handleMoveStart(e);
      return;
    }

    // Compute bounding box for the new selection
    const selectedPolygons = polygons.filter((_p, idx) => [index].includes(idx));
    const bbox = calculateBoundingBox(selectedPolygons);

    // Set the selection
    setSelectionFromIds([index]);

    // Immediately start moving with the computed anchor
    const point = clientToSVGCoords(e.nativeEvent, svgRef);
    moveStartRef.current = { pointer: point, anchor: { x: bbox.x, y: bbox.y } };
    setIsMoving(true);
  };

  // Helper function to update position
  const handlePositionChange = (axis: 'x' | 'y', value: number) => {
    const currentX = boundingBox.x;
    const currentY = boundingBox.y;
    const deltaX = axis === 'x' ? value - currentX : 0;
    const deltaY = axis === 'y' ? value - currentY : 0;

    const updatedPolygons = polygons.map((polygon, idx) => {
      if (!selectedIds.includes(idx)) return polygon;
      const points = parsePoints(polygon.points).map(p => ({
        x: p.x + deltaX,
        y: p.y + deltaY,
      }));
      return { ...polygon, points: stringifyPoints(points) };
    });

    setPolygons(updatedPolygons);
    const selectedPolygons = updatedPolygons.filter((_p, idx) => selectedIds.includes(idx));
    const bbox = calculateBoundingBox(selectedPolygons);
    setFixedAnchor({ x: bbox.x, y: bbox.y });
    setDimensions({ width: bbox.width, height: bbox.height });
    setBaseDimensions({ width: bbox.width, height: bbox.height });
    setSelectionOrigin({ x: bbox.x, y: bbox.y });
  };

  // Helper function to update dimensions
  const handleDimensionChange = (dimension: 'width' | 'height', value: number) => {
    if (value <= 0) return; // Prevent invalid dimensions

    const currentWidth = boundingBox.width;
    const currentHeight = boundingBox.height;
    const scaleX = dimension === 'width' ? value / currentWidth : 1;
    const scaleY = dimension === 'height' ? value / currentHeight : 1;

    const origin = { x: boundingBox.x, y: boundingBox.y };

    const updatedPolygons = polygons.map((polygon, idx) => {
      if (!selectedIds.includes(idx)) return polygon;
      const points = parsePoints(polygon.points).map(p => {
        const localX = p.x - origin.x;
        const localY = p.y - origin.y;
        return {
          x: origin.x + localX * scaleX,
          y: origin.y + localY * scaleY,
        };
      });
      return { ...polygon, points: stringifyPoints(points) };
    });

    setPolygons(updatedPolygons);
    const selectedPolygons = updatedPolygons.filter((_p, idx) => selectedIds.includes(idx));
    const bbox = calculateBoundingBox(selectedPolygons);
    setFixedAnchor({ x: bbox.x, y: bbox.y });
    setDimensions({ width: bbox.width, height: bbox.height });
    setBaseDimensions({ width: bbox.width, height: bbox.height });
    setSelectionOrigin({ x: bbox.x, y: bbox.y });
  };

  return (
    <div className="flex h-screen relative">
      {/* Layer Sidebar */}
      <div className="w-64 bg-gray-100 border-r border-gray-300 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Layers</h2>
          <div className="space-y-2">
            {polygons.map((polygon, index) => {
              const isSelected = selectedIds.includes(index);
              return (
                <div
                  key={index}
                  onClick={() => setSelectionFromIds([index])}
                  className={`p-3 rounded cursor-pointer border ${
                    isSelected
                      ? 'bg-blue-100 border-blue-500'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: polygon.fill }}
                    />
                    <span className="text-sm font-medium">Shape {index + 1}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8" style={{ marginRight: '320px' }}>
        {/* Hidden container for test data attributes */}
        <div
          data-testid="debug-state"
          data-selection-ids={hasSelection ? selectedIds.join(',') : ''}
          data-width={hasSelection ? Math.abs(dimensions.width).toString() : ''}
          data-height={hasSelection ? Math.abs(dimensions.height).toString() : ''}
          data-scale-x={hasSelection ? Math.abs(scaleX).toString() : ''}
          data-scale-y={hasSelection ? Math.abs(scaleY).toString() : ''}
          data-flip-x={hasSelection ? flipped.x.toString() : ''}
          data-flip-y={hasSelection ? flipped.y.toString() : ''}
          style={{ display: 'none' }}
          aria-hidden="true"
        />

      <svg
        ref={svgRef}
        width={CONSTANTS.CANVAS_WIDTH}
        height={CONSTANTS.CANVAS_HEIGHT}
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
              const isHovered = hoveredId === index;
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
                  stroke={isHovered ? "#3b82f6" : polygon.stroke}
                  strokeWidth={isHovered ? 2 : polygon.strokeWidth}
                  onMouseDown={(e) => handlePolygonMouseDown(e, index)}
                  onMouseEnter={() => setHoveredId(index)}
                  onMouseLeave={() => setHoveredId(null)}
                />
              );
            })}

            <rect
              data-testid="selection-bounding-box"
              data-selection-ids={selectedIds.join(',')}
              data-flipped-x={flipped.x}
              data-flipped-y={flipped.y}
              data-width={Math.abs(dimensions.width)}
              data-height={Math.abs(dimensions.height)}
              data-scale-x={Math.abs(scaleX)}
              data-scale-y={Math.abs(scaleY)}
              x={boundingBox.x}
              y={boundingBox.y}
              width={boundingBox.width}
              height={boundingBox.height}
              fill="transparent"
              stroke="#3b82f6"
              strokeWidth="1"
              cursor="move"
              onMouseDown={handleMoveStart}
            />

            {/* Invisible Edge Resize Handles */}
            {/* Top */}
            <rect
                data-testid="resize-handle-top"
                x={boundingBox.x}
                y={boundingBox.y - 5}
                width={boundingBox.width}
                height={10}
                fill="transparent"
                cursor={HANDLE_CONFIG['top'].cursor}
                onMouseDown={(e) => handleResizeStart(e, 'top')}
            />
            {/* Bottom */}
            <rect
                data-testid="resize-handle-bottom"
                x={boundingBox.x}
                y={boundingBox.y + boundingBox.height - 5}
                width={boundingBox.width}
                height={10}
                fill="transparent"
                cursor={HANDLE_CONFIG['bottom'].cursor}
                onMouseDown={(e) => handleResizeStart(e, 'bottom')}
            />
             {/* Left */}
             <rect
                data-testid="resize-handle-left"
                x={boundingBox.x - 5}
                y={boundingBox.y}
                width={10}
                height={boundingBox.height}
                fill="transparent"
                cursor={HANDLE_CONFIG['left'].cursor}
                onMouseDown={(e) => handleResizeStart(e, 'left')}
            />
            {/* Right */}
            <rect
                data-testid="resize-handle-right"
                x={boundingBox.x + boundingBox.width - 5}
                y={boundingBox.y}
                width={10}
                height={boundingBox.height}
                fill="transparent"
                cursor={HANDLE_CONFIG['right'].cursor}
                onMouseDown={(e) => handleResizeStart(e, 'right')}
            />

            {(Object.entries(handlePositions) as [HandleName, Point][]).map(([handle, pos]) => {
              const config = HANDLE_CONFIG[handle];
              if (!config.isCorner) return null;
              const effectiveHandle = getEffectiveHandle(handle, flipped);
              const isFixedAnchor = effectiveHandle === 'top-left';
              const size = config.isCorner ? CONSTANTS.HANDLE_SIZE.corner : CONSTANTS.HANDLE_SIZE.edge;
              return (
                <rect
                  key={handle}
                  data-testid={`resize-handle-${handle}`}
                  data-is-fixed-anchor={isFixedAnchor}
                  x={pos.x - size / 2}
                  y={pos.y - size / 2}
                  width={size}
                  height={size}
                  fill="white"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  cursor={config.cursor}
                  onMouseDown={(e) => handleResizeStart(e, handle)}
                />
              );
            })}
          </>
        ) : (
          polygons.map((polygon, index) => {
            const isHovered = hoveredId === index;
            return (
              <polygon
                key={index}
                points={polygon.points}
                fill={polygon.fill}
                stroke={isHovered ? "#3b82f6" : polygon.stroke}
                strokeWidth={isHovered ? 2 : polygon.strokeWidth}
                onMouseDown={(e) => handlePolygonMouseDown(e, index)}
                onMouseEnter={() => setHoveredId(index)}
                onMouseLeave={() => setHoveredId(null)}
              />
            );
          })
        )}

        {/* Guidelines Rendering */}
        {guidelines.map((guide, i) => (
          <line
            key={i}
            x1={guide.type === 'vertical' ? guide.pos : guide.start}
            y1={guide.type === 'vertical' ? guide.start : guide.pos}
            x2={guide.type === 'vertical' ? guide.pos : guide.end}
            y2={guide.type === 'vertical' ? guide.end : guide.pos}
            stroke="red"
            strokeWidth="1"
            pointerEvents="none"
          />
        ))}

        {previewBBox && (
            <rect
                data-testid="preview-bounding-box"
                x={previewBBox.x}
                y={previewBBox.y}
                width={previewBBox.width}
                height={previewBBox.height}
                fill="transparent"
                stroke="#3b82f6"
                strokeWidth="1"
                pointerEvents="none"
            />
        )}

        {selectionRect && (
          <rect
            data-testid="marquee-selection-rect"
            x={Math.min(selectionRect.start.x, selectionRect.current.x)}
            y={Math.min(selectionRect.start.y, selectionRect.current.y)}
            width={Math.abs(selectionRect.current.x - selectionRect.start.x)}
            height={Math.abs(selectionRect.current.y - selectionRect.start.y)}
            fill="rgba(59, 130, 246, 0.1)"
            stroke="#3b82f6"
            strokeWidth="2"
          />
        )}
      </svg>
        <div className="mt-4">
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={resetToInitial}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Properties Panel - Absolutely Positioned Overlay */}
      <div className="absolute top-0 right-0 w-80 h-full bg-gray-100 border-l border-gray-300 shadow-lg overflow-y-auto z-10 flex flex-col">
        {/* Tab Header */}
        <div className="flex border-b border-gray-300 bg-white shrink-0">
          <button
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === 'design'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('design')}
          >
            Design
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === 'chat'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('chat')}
          >
            Chat <span className="ml-1 text-xs text-gray-400 font-normal">⌘K</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'design' ? (
            <>
              {hasSelection && selectedIds.length === 1 ? (
                <div className="space-y-4">
                  {/* Fill Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fill</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={polygons[selectedIds[0]].fill}
                        onChange={(e) => {
                          const newPolygons = [...polygons];
                          newPolygons[selectedIds[0]] = {
                            ...newPolygons[selectedIds[0]],
                            fill: e.target.value,
                          };
                          setPolygons(newPolygons);
                        }}
                        className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={polygons[selectedIds[0]].fill}
                        onChange={(e) => {
                          const newPolygons = [...polygons];
                          newPolygons[selectedIds[0]] = {
                            ...newPolygons[selectedIds[0]],
                            fill: e.target.value,
                          };
                          setPolygons(newPolygons);
                        }}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm bg-white text-gray-900"
                      />
                    </div>
                  </div>

                  {/* Stroke Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stroke</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={polygons[selectedIds[0]].stroke}
                        onChange={(e) => {
                          const newPolygons = [...polygons];
                          newPolygons[selectedIds[0]] = {
                            ...newPolygons[selectedIds[0]],
                            stroke: e.target.value,
                          };
                          setPolygons(newPolygons);
                        }}
                        className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={polygons[selectedIds[0]].stroke}
                        onChange={(e) => {
                          const newPolygons = [...polygons];
                          newPolygons[selectedIds[0]] = {
                            ...newPolygons[selectedIds[0]],
                            stroke: e.target.value,
                          };
                          setPolygons(newPolygons);
                        }}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm bg-white text-gray-900"
                      />
                    </div>
                  </div>

                  {/* Position and Dimensions */}
                  <div className="pt-2 border-t border-gray-300">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Position & Size</h3>

                    {/* X Position */}
                    <div className="mb-2">
                      <label className="block text-xs text-gray-600 mb-1">X</label>
                      <input
                        type="number"
                        value={Math.round(boundingBox.x)}
                        onChange={(e) => handlePositionChange('x', Number(e.target.value))}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            handlePositionChange('x', boundingBox.x + 1);
                          } else if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            handlePositionChange('x', boundingBox.x - 1);
                          }
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white text-gray-900"
                      />
                    </div>

                    {/* Y Position */}
                    <div className="mb-2">
                      <label className="block text-xs text-gray-600 mb-1">Y</label>
                      <input
                        type="number"
                        value={Math.round(boundingBox.y)}
                        onChange={(e) => handlePositionChange('y', Number(e.target.value))}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            handlePositionChange('y', boundingBox.y - 1);
                          } else if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            handlePositionChange('y', boundingBox.y + 1);
                          }
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white text-gray-900"
                      />
                    </div>

                    {/* Width */}
                    <div className="mb-2">
                      <label className="block text-xs text-gray-600 mb-1">Width</label>
                      <input
                        type="number"
                        value={Math.round(boundingBox.width)}
                        onChange={(e) => handleDimensionChange('width', Number(e.target.value))}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            handleDimensionChange('width', boundingBox.width + 1);
                          } else if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            handleDimensionChange('width', boundingBox.width - 1);
                          }
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white text-gray-900"
                      />
                    </div>

                    {/* Height */}
                    <div className="mb-2">
                      <label className="block text-xs text-gray-600 mb-1">Height</label>
                      <input
                        type="number"
                        value={Math.round(boundingBox.height)}
                        onChange={(e) => handleDimensionChange('height', Number(e.target.value))}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            handleDimensionChange('height', boundingBox.height + 1);
                          } else if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            handleDimensionChange('height', boundingBox.height - 1);
                          }
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white text-gray-900"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                 <div className="text-center text-gray-500 mt-10">
                   <p>Select a shape to edit its properties.</p>
                 </div>
              )}
            </>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex-1 space-y-4 mb-4 overflow-y-auto">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg text-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-50 text-blue-900'
                        : 'bg-white border border-gray-200 text-gray-800'
                    }`}
                  >
                    <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold" style={{ fontSize: '0.65rem' }}>
                      {msg.role}
                    </div>
                    {msg.content}
                  </div>
                ))}
              </div>
              <div className="mt-auto pt-4 border-t border-gray-200">
                <textarea
                  className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  placeholder="Ask a question..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (!chatInput.trim()) return;
                      const newMsg = { role: 'user' as const, content: chatInput };
                      setChatMessages((prev) => [...prev, newMsg]);
                      setChatInput('');
                      // Simulate response
                      setTimeout(() => {
                        setChatMessages((prev) => [
                          ...prev,
                          { role: 'assistant', content: "I'm a mock AI. I can't actually design yet!" },
                        ]);
                      }, 1000);
                    }
                  }}
                />
                <div className="text-xs text-gray-400 mt-1 text-right">Press Enter to send</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResizableCanvas;
