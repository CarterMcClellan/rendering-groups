import React, { useState, useRef, useEffect } from 'react';
import { Dimensions, Position, Handle, Scale } from '../types';
import { getBoundingBox, getHandleCursor } from '../utils';
import { PolygonShape } from './Shape';

const START_POSITION = { x: 100, y: 100 };

const POLYGONS = [
  new PolygonShape({
    id: 'polygon-1',
    top: START_POSITION.y,
    left: START_POSITION.x,
    sideLength: 100,
    sides: 5
  })
]

const Demo = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Group Data
  const [startPosition, setStartPosition] = useState<Position | null>(null);
  const [startDimensions, setStartDimensions] = useState<Dimensions | null>(null);
  
  // These should be computed, from the polygons + their transformations
  const [groupDimensions, setGroupDimensions] = useState<Dimensions>({ w: 100, h: 100 }); 
  const [groupPosition, setGroupPosition] = useState<Position>({ x: START_POSITION.x, y: START_POSITION.y });

  const handlePositions = getBoundingBox(groupDimensions, groupPosition);
  const [groupScale, setGroupScale] = useState<Scale>({ x: 1, y: 1 });

  // Mouse State
  const [activeHandle, setActiveHandle] = useState<null | Handle>(null); // Handle being manipulated
  const [anchorHandle, setAnchorHandle] = useState<null | Handle>(null); // Handle opposite the active handle
  const [isDragging, setIsDragging] = useState(false);

  const getCanvasPosition = (event: React.MouseEvent<SVGSVGElement>): Position => {
    const { clientX, clientY } = event;
    const { left, top } = svgRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
    const x = clientX - left;
    const y = clientY - top;

    return {
      x,
      y
    }
  }

  const handleStart = (event: React.MouseEvent<SVGSVGElement>) => {
    const {x, y} = getCanvasPosition(event);
    setStartPosition({x, y});
    setStartDimensions({w: groupDimensions.w, h: groupDimensions.h});

    // Check if we clicked on a handle
    for (const [handle, position] of Object.entries(handlePositions)) {
      const dx = Math.abs(x - position.x);
      const dy = Math.abs(y - position.y);
      if (dx <= 10 && dy <= 10) {  // 10px hit area
        setActiveHandle(handle as Handle);
        
        // Set the anchor handle (opposite corner)
        switch (handle) {
          case 'TOP_LEFT':
            setAnchorHandle(Handle.BOTTOM_RIGHT);
            break;
          case 'TOP_RIGHT':
            setAnchorHandle(Handle.BOTTOM_LEFT);
            break;
          case 'BOTTOM_LEFT':
            setAnchorHandle(Handle.TOP_RIGHT);
            break;
          case 'BOTTOM_RIGHT':
            setAnchorHandle(Handle.TOP_LEFT);
            break;
          case 'TOP':
            setAnchorHandle(Handle.BOTTOM);
            break;
          case 'BOTTOM':
            setAnchorHandle(Handle.TOP);
            break;
          case 'LEFT':
            setAnchorHandle(Handle.RIGHT);
            break;
          case 'RIGHT':
            setAnchorHandle(Handle.LEFT);
            break;
        }
        setIsDragging(true);
        break;
      }
    }
  }

  const handleStop = (event: React.MouseEvent<SVGSVGElement>) => {
    setActiveHandle(null);
    setAnchorHandle(null);
    setIsDragging(false);
    setStartPosition(null);
  }

  const handleResize = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!startPosition || !activeHandle || !isDragging || !startDimensions) return;

    const {x, y} = getCanvasPosition(event);
    const deltaX = x - startPosition.x;
    const deltaY = y - startPosition.y;
    
    // Create new position and dimensions objects to avoid direct mutation
    let newPosition = {...groupPosition};
    let newDimensions = {...groupDimensions};

    // Update based on which handle is being dragged
    switch (activeHandle) {
      case 'TOP_LEFT':
        newPosition.x += deltaX;
        newPosition.y += deltaY;
        newDimensions.w -= deltaX;
        newDimensions.h -= deltaY;
        break;
      case 'TOP_RIGHT':
        newPosition.y += deltaY;
        newDimensions.w += deltaX;
        newDimensions.h -= deltaY;
        break;
      case 'BOTTOM_LEFT':
        newPosition.x += deltaX;
        newDimensions.w -= deltaX;
        newDimensions.h += deltaY;
        break;
      case 'BOTTOM_RIGHT':
        newDimensions.w += deltaX;
        newDimensions.h += deltaY;
        break;
      case 'TOP':
        newPosition.y += deltaY;
        newDimensions.h -= deltaY;
        break;
      case 'BOTTOM':
        newDimensions.h += deltaY;
        break;
      case 'LEFT':
        newPosition.x += deltaX;
        newDimensions.w -= deltaX;
        break;
      case 'RIGHT':
        newDimensions.w += deltaX;
        break;
    }
    
    // Prevent negative dimensions
    if (newDimensions.w > 10 && newDimensions.h > 10) {
      setGroupPosition(newPosition);
      setGroupDimensions(newDimensions);
      setStartPosition({x, y});
      setGroupScale({x: newDimensions.w / startDimensions.w, y: newDimensions.h / startDimensions.h});
    }
  }

  const getTransformString = () => {
    return `scale(${groupScale.x}, ${groupScale.y})`;
  }

  const getTransformOrigin = () => {
    if (anchorHandle) {
      const anchor = handlePositions[anchorHandle];
      return `${anchor.x}, ${anchor.y}`;
    }
  }

  return (
    <svg
      width="800px"
      height="800px"
      viewBox="0 0 800 800"
      preserveAspectRatio="xMidYMid meet"
      style={{ backgroundColor: "#f5f5f5" }}
      ref={svgRef}
      onMouseDown={handleStart}
      onMouseUp={handleStop}
      onMouseMove={(e) => handleResize(e)}
    >
      {/* Group of Elements */}
      <g
        transform={getTransformString()} // this should be the anchor position
        transform-origin={getTransformOrigin()} // this should be the anchor position
      >
        {POLYGONS.map((polygon) => (
          <polygon
            key={polygon.id}
            points={polygon.points}
            fill={polygon.fill}
            stroke={polygon.stroke}
            strokeWidth={polygon.strokeWidth}
          />
        ))}
      </g>

      {/* Bounding Box Controls */}
      <rect 
        x={groupPosition.x} 
        y={groupPosition.y} 
        width={groupDimensions.w} 
        height={groupDimensions.h} 
        fill="none" 
        stroke="blue"
        strokeWidth="2"
        strokeDasharray="4"
      />
      {
        Object.entries(handlePositions).map(([handle, position]) => (
          <circle 
            key={handle}
            cx={position.x}
            cy={position.y}
            r="5"
            fill={handle === activeHandle ? "blue" : handle === anchorHandle ? "red" : "white"}
            stroke={handle === activeHandle ? "blue" : handle === anchorHandle ? "red" : "black"}
            strokeWidth="1"
            cursor={getHandleCursor(handle as Handle)}
          />
        ))
      }
    </svg>
  )
};

export default Demo;