import { useResizableCanvas } from '../../hooks/useResizableCanvas';
import { CONSTANTS, HANDLE_CONFIG } from '../../constants/canvas.constants';
import type { HandleName, Point } from '../../types/canvas.types';

const ResizableCanvas = () => {
  const {
    svgRef,
    fixedAnchor,
    dimensions,
    scaleX,
    scaleY,
    flipped,
    isGrouped,
    polygons,
    boundingBox,
    handleResizeStart,
    applyGroupTransform,
    regroupElements,
    resetToInitial,
  } = useResizableCanvas();

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
        {isGrouped && (
          <circle
            cx={fixedAnchor.x}
            cy={fixedAnchor.y}
            r={CONSTANTS.ANCHOR_RADIUS}
            fill="#22c55e"
            stroke="white"
            strokeWidth="1"
          />
        )}

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
