import React, { useState, useRef, useEffect } from 'react';
import { ViewportElement } from './ViewportElement';
import { PolygonShape } from './Shape';

const Viewport = () => {
  // Change fixedAnchor to be part of state
  const [fixedAnchor, setFixedAnchor] = useState({ x: 150, y: 150 });
  
  // State for the current dimensions and flipping
  const [dimensions, setDimensions] = useState({ width: 100, height: 100 });
  const [flipped, setFlipped] = useState({ x: false, y: false });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeHandle, setActiveHandle] = useState(null);
  const svgRef = useRef(null);
  
  // Sample shapes for demonstration
  const shapes = [
    new PolygonShape("1", "0,0 30,0 15,30", "#ff6347", "black", 1),
    new PolygonShape("2", "40,10 70,10 55,40", "#4682b4", "black", 1),
    new PolygonShape("3", "20,50 50,50 35,80", "#9acd32", "black", 1)
  ];
  
  // Calculate scale factors (including direction for flipping)
  const scaleX = (flipped.x ? -1 : 1) * Math.abs(dimensions.width) / 100;
  const scaleY = (flipped.y ? -1 : 1) * Math.abs(dimensions.height) / 100;
  
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
  
  // Calculate the correct x and y positions for the group based on flipping
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
  
  return (
    <div className="flex flex-col items-center p-8">
      <div className="mb-4">
        <p className="text-lg font-semibold">Drag any handle to resize or flip the shapes</p>
        <p>Width: {Math.abs(dimensions.width).toFixed(0)}px, Height: {Math.abs(dimensions.height).toFixed(0)}px</p>
        <p>Flipped X: {flipped.x ? 'Yes' : 'No'}, Flipped Y: {flipped.y ? 'Yes' : 'No'}</p>
      </div>
      
      <svg 
        ref={svgRef}
        width="500" 
        height="500" 
        className="border border-gray-300 bg-gray-50"
      >
        
        {/* Group with transform for position */}
        <g transform={`translate(${groupX}, ${groupY})`}>
          {/* Render shapes using ViewportElement */}
          {shapes.map((shape) => (
            <ViewportElement 
              key={shape.id}
              shape={shape}
              scaleX={scaleX}
              scaleY={scaleY}
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
      </svg>
      
      <div className="mt-4">
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => {
            setDimensions({ width: 100, height: 100 });
            setFlipped({ x: false, y: false });
            setFixedAnchor({ x: 150, y: 150 }); // Reset anchor position
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default Viewport;