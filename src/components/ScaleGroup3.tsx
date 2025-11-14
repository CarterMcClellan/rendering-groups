import React, { useState, useRef, useEffect } from 'react';

const ResizableSvgGroup = () => {
  // Change fixedAnchor to be part of state
  const [fixedAnchor, setFixedAnchor] = useState({ x: 150, y: 150 });

  // State for the current dimensions and flipping
  const [dimensions, setDimensions] = useState({ width: 100, height: 100 });
  // Store the base dimensions (the "original" size of the group for scale calculation)
  const [baseDimensions, setBaseDimensions] = useState({ width: 100, height: 100 });
  const [flipped, setFlipped] = useState({ x: false, y: false });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeHandle, setActiveHandle] = useState(null);
  const [isGrouped, setIsGrouped] = useState(true);
  const svgRef = useRef(null);

  // Sample polygons for demonstration - now stateful so they can be updated
  const [polygons, setPolygons] = useState([
    { points: "0,0 30,0 15,30", fill: "#ff6347", stroke: "black", strokeWidth: 1 },
    { points: "40,10 70,10 55,40", fill: "#4682b4", stroke: "black", strokeWidth: 1 },
    { points: "20,50 50,50 35,80", fill: "#9acd32", stroke: "black", strokeWidth: 1 }
  ]);

  // Calculate scale factors (including direction for flipping)
  // Scale = current dimensions / base dimensions
  const scaleX = (flipped.x ? -1 : 1) * Math.abs(dimensions.width) / baseDimensions.width;
  const scaleY = (flipped.y ? -1 : 1) * Math.abs(dimensions.height) / baseDimensions.height;

  // // Calculate the correct x and y positions for the group based on flipping
  const groupX = fixedAnchor.x;
  const groupY = fixedAnchor.y;
  
  // Calculate the bounding box coordinates
  const boxX = fixedAnchor.x + (flipped.x ? dimensions.width : 0);
  const boxY = fixedAnchor.y + (flipped.y ? dimensions.height : 0);
  const boxWidth = Math.abs(dimensions.width);
  const boxHeight = Math.abs(dimensions.height);
  
  // Calculate handle positions
  const handlePositions = {
    right: { x: boxX + boxWidth, y: boxY + boxHeight / 2 },
    bottom: { x: boxX + boxWidth / 2, y: boxY + boxHeight },
    left: { x: boxX, y: boxY + boxHeight / 2 },
    top: { x: boxX + boxWidth / 2, y: boxY },
    'bottom-right': { x: boxX + boxWidth, y: boxY + boxHeight },
    'bottom-left': { x: boxX, y: boxY + boxHeight },
    'top-right': { x: boxX + boxWidth, y: boxY },
    'top-left': { x: boxX, y: boxY }
  };
  
  // Handle cursor styles
  const handleCursors = {
    right: 'ew-resize',
    bottom: 'ns-resize',
    left: 'ew-resize',
    top: 'ns-resize',
    'bottom-right': 'nwse-resize',
    'bottom-left': 'nesw-resize',
    'top-right': 'nesw-resize',
    'top-left': 'nwse-resize'
  };

  // Helper function to calculate bounding box from polygon coordinates
  const calculateBoundingBox = (polygonList) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    polygonList.forEach((polygon) => {
      const pointPairs = polygon.points.split(' ').map(pair => {
        const [x, y] = pair.split(',').map(Number);
        return { x, y };
      });

      pointPairs.forEach(point => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  };

  // Function to apply group transform to individual polygons
  const applyGroupTransform = () => {
    const transformed = polygons.map((polygon) => {
      // Parse the points string into an array of {x, y} coordinates
      const pointPairs = polygon.points.split(' ').map(pair => {
        const [x, y] = pair.split(',').map(Number);
        return { x, y };
      });

      // Apply scale and translate to each point
      const transformedPoints = pointPairs.map(point => {
        const scaledX = point.x * scaleX;
        const scaledY = point.y * scaleY;
        const finalX = groupX + scaledX;
        const finalY = groupY + scaledY;
        return { x: finalX, y: finalY };
      });

      // Convert back to points string
      const transformedPointsString = transformedPoints
        .map(p => `${p.x},${p.y}`)
        .join(' ');

      return {
        ...polygon,
        points: transformedPointsString
      };
    });

    // Update the polygons array with transformed values
    setPolygons(transformed);

    // Calculate bounding box of the transformed polygons
    const bbox = calculateBoundingBox(transformed);

    // Reset transform state to identity (no scale/flip) matching the bounding box
    setFixedAnchor({ x: bbox.x, y: bbox.y });
    // Set both dimensions and baseDimensions to the bbox size (scale = 1:1)
    setDimensions({ width: bbox.width, height: bbox.height });
    setBaseDimensions({ width: bbox.width, height: bbox.height });
    setFlipped({ x: false, y: false });

    setIsGrouped(false);
  };

  // Handle resize start
  const handleResizeStart = (e, handle) => {
    e.stopPropagation();
    setIsDragging(true);
    setActiveHandle(handle);
    
    const svgPoint = svgRef.current.createSVGPoint();
    svgPoint.x = e.clientX;
    svgPoint.y = e.clientY;
    
    // Transform to SVG coordinates
    const screenCTM = svgRef.current.getScreenCTM().inverse();
    const transformedPoint = svgPoint.matrixTransform(screenCTM);
    
    setDragStart(transformedPoint);
  };
  
  // Handle resize during drag
  const handleResize = (e) => {
    if (!isDragging) return;
    
    const svgPoint = svgRef.current.createSVGPoint();
    svgPoint.x = e.clientX;
    svgPoint.y = e.clientY;
    
    // Transform to SVG coordinates
    const screenCTM = svgRef.current.getScreenCTM().inverse();
    const transformedPoint = svgPoint.matrixTransform(screenCTM);
    
    // Calculate new dimensions based on which handle is being dragged
    let newWidth = dimensions.width;
    let newHeight = dimensions.height;
    let newAnchorX = fixedAnchor.x;
    let newAnchorY = fixedAnchor.y;
    
    switch (activeHandle) {
      case 'right':
        newWidth = transformedPoint.x - fixedAnchor.x;
        break;
      case 'bottom':
        newHeight = transformedPoint.y - fixedAnchor.y;
        break;
      case 'left':
        newWidth = fixedAnchor.x + dimensions.width - transformedPoint.x;
        newAnchorX = transformedPoint.x;
        break;
      case 'top':
        newHeight = fixedAnchor.y + dimensions.height - transformedPoint.y;
        newAnchorY = transformedPoint.y;
        break;
      case 'bottom-right':
        newWidth = transformedPoint.x - fixedAnchor.x;
        newHeight = transformedPoint.y - fixedAnchor.y;
        break;
      case 'bottom-left':
        newWidth = fixedAnchor.x + dimensions.width - transformedPoint.x;
        newHeight = transformedPoint.y - fixedAnchor.y;
        newAnchorX = transformedPoint.x;
        break;
      case 'top-right':
        newWidth = transformedPoint.x - fixedAnchor.x;
        newHeight = fixedAnchor.y + dimensions.height - transformedPoint.y;
        newAnchorY = transformedPoint.y;
        break;
      case 'top-left':
        newWidth = fixedAnchor.x + dimensions.width - transformedPoint.x;
        newHeight = fixedAnchor.y + dimensions.height - transformedPoint.y;
        newAnchorX = transformedPoint.x;
        newAnchorY = transformedPoint.y;
        break;
    }
    
    // Determine if we should flip on X or Y axis
    const shouldFlipX = newWidth < 0;
    const shouldFlipY = newHeight < 0;
    
    // Set minimum size
    const minSize = 10;
    const absWidth = Math.max(minSize, Math.abs(newWidth));
    const absHeight = Math.max(minSize, Math.abs(newHeight));
    
    // Update dimensions while preserving the sign
    const finalWidth = shouldFlipX ? -absWidth : absWidth;
    const finalHeight = shouldFlipY ? -absHeight : absHeight;
    
    // Update state
    setFlipped({ x: shouldFlipX, y: shouldFlipY });
    setDimensions({ width: finalWidth, height: finalHeight });
    setFixedAnchor({ x: newAnchorX, y: newAnchorY });
  };
  
  // Handle resize end
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
        width="500" 
        height="500" 
        className="border border-gray-300 bg-gray-50"
      >
        {/* Fixed anchor point marker - only show when grouped */}
        {isGrouped && (
          <circle
            cx={fixedAnchor.x}
            cy={fixedAnchor.y}
            r="5"
            fill="#22c55e"
            stroke="white"
            strokeWidth="1"
          />
        )}

        {/* Conditional rendering based on grouped state */}
        {isGrouped ? (
          <>
            {/* Group with transform for scaling and flipping */}
            <g
              transform={`translate(${groupX}, ${groupY}) scale(${scaleX}, ${scaleY})`}
            >
              {/* Sample polygons */}
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

            {/* Current bounding box of the scaled group */}
            <rect
              x={boxX}
              y={boxY}
              width={boxWidth}
              height={boxHeight}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1"
              strokeDasharray="4"
            />

            {/* Resize handles */}
            {Object.entries(handlePositions).map(([handle, pos]) => (
              <circle
                key={handle}
                cx={pos.x}
                cy={pos.y}
                r={handle.includes('-') ? 8 : 6} // Corner handles slightly larger
                fill="#3b82f6"
                stroke="white"
                strokeWidth="2"
                cursor={handleCursors[handle]}
                onMouseDown={(e) => handleResizeStart(e, handle)}
              />
            ))}
          </>
        ) : (
          <>
            {/* Individual polygons (already transformed) */}
            {polygons.map((polygon, index) => (
              <polygon
                key={index}
                points={polygon.points}
                fill={polygon.fill}
                stroke={polygon.stroke}
                strokeWidth={polygon.strokeWidth}
              />
            ))}
          </>
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
            onClick={() => {
              // Calculate bounding box from current polygon coordinates
              const bbox = calculateBoundingBox(polygons);

              // Translate polygons to be relative to the bounding box origin
              const localPolygons = polygons.map((polygon) => {
                const pointPairs = polygon.points.split(' ').map(pair => {
                  const [x, y] = pair.split(',').map(Number);
                  return { x, y };
                });

                // Translate points to local coordinates (relative to bbox origin)
                const localPoints = pointPairs.map(point => ({
                  x: point.x - bbox.x,
                  y: point.y - bbox.y
                }));

                const localPointsString = localPoints
                  .map(p => `${p.x},${p.y}`)
                  .join(' ');

                return {
                  ...polygon,
                  points: localPointsString
                };
              });

              // Update polygons to use local coordinates
              setPolygons(localPolygons);

              // Update state to match the actual bounding box
              setFixedAnchor({ x: bbox.x, y: bbox.y });
              // Set both current dimensions and base dimensions to bbox size (scale = 1:1)
              setDimensions({ width: bbox.width, height: bbox.height });
              setBaseDimensions({ width: bbox.width, height: bbox.height });
              setFlipped({ x: false, y: false });
              setIsGrouped(true);
            }}
          >
            Re-group Elements
          </button>
        )}
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => {
            // Reset to original polygons
            setPolygons([
              { points: "0,0 30,0 15,30", fill: "#ff6347", stroke: "black", strokeWidth: 1 },
              { points: "40,10 70,10 55,40", fill: "#4682b4", stroke: "black", strokeWidth: 1 },
              { points: "20,50 50,50 35,80", fill: "#9acd32", stroke: "black", strokeWidth: 1 }
            ]);
            setDimensions({ width: 100, height: 100 });
            setBaseDimensions({ width: 100, height: 100 });
            setFlipped({ x: false, y: false });
            setFixedAnchor({ x: 150, y: 150 }); // Reset anchor position
            setIsGrouped(true);
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default ResizableSvgGroup;