import React, { useState, useEffect } from 'react';
import { Dimensions, GroupTransform, Position } from '../types';
import { Scale } from './Shape';

interface BoundingBoxProps {
  groupDimensions: Dimensions;
  groupPosition: Position;
  // setCurrentGroupTransform: (transform: GroupTransform | null) => void;
  setScale: (scale: Scale) => void;
  svgRef: React.RefObject<SVGSVGElement>;
}

const BoundingBox: React.FC<BoundingBoxProps> = ({
  groupDimensions,
  groupPosition,
  // setCurrentGroupTransform,
  setScale,
  svgRef
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  
  // State to track current dimensions and position
  const [initialDimension, setInitialDimensions] = useState<Dimensions>(groupDimensions);
  const [currentDimensions, setCurrentDimensions] = useState<Dimensions>(groupDimensions);
  const [boxPosition, setBoxPosition] = useState<Position>(groupPosition);
  
  // Calculate the actual bounding box coordinates (always positive dimensions)
  const boxX = boxPosition.x;
  const boxY = boxPosition.y;
  const boxWidth = currentDimensions.width;
  const boxHeight = currentDimensions.height;

  // Calculate handle positions
  const handlePositions = {
    right: { x: boxX + boxWidth, y: boxY + boxHeight / 2 },
    bottom: { x: boxX + boxWidth / 2, y: boxY + boxHeight },
    left: { x: boxX, y: boxY + boxHeight / 2 },
    top: { x: boxX + boxWidth / 2, y: boxY },
    bottomRight : { x: boxX + boxWidth, y: boxY + boxHeight },
    bottomLeft: { x: boxX, y: boxY + boxHeight },
    topRight: { x: boxX + boxWidth, y: boxY },
    topLeft: { x: boxX, y: boxY }
  };
  
  // Handle cursor styles
  const handleCursors: Record<string, string> = {
    right: 'ew-resize',
    bottom: 'ns-resize',
    left: 'ew-resize',
    top: 'ns-resize',
    bottomRight: 'nwse-resize',
    bottomLeft: 'nesw-resize',
    topRight: 'nesw-resize',
    topLeft: 'nwse-resize'
  };
  
  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    if (!svgRef.current) return;
    
    setIsDragging(true);
    setActiveHandle(handle);
    
    const svgPoint = svgRef.current.createSVGPoint();
    svgPoint.x = e.clientX;
    svgPoint.y = e.clientY;
    
    // Transform to SVG coordinates
    const screenCTM = svgRef.current.getScreenCTM();
    if (screenCTM) {
      const transformedPoint = svgPoint.matrixTransform(screenCTM.inverse());
      setDragStart(transformedPoint);
    }
  };

  const updateGroupTransform = (newWidth: number, newHeight: number, newPosition: Position, flipped: { x: boolean, y: boolean }) => {
    const scaleX = (flipped.x ? -1 : 1) * Math.abs(newWidth) / initialDimension.width;
    const scaleY = (flipped.y ? -1 : 1) * Math.abs(newHeight) / initialDimension.height;
    setScale({
        x: scaleX,
        y: scaleY
      });
  };
  
  const handleResize = (e: MouseEvent) => {
    /// I absolutely HATE this function.
    ///
    /// Its such a drag to write there is so much boiler plate and every little change I make seems to break it
    if (!isDragging || !svgRef.current || !activeHandle) return;
    
    const svgPoint = svgRef.current.createSVGPoint();
    svgPoint.x = e.clientX;
    svgPoint.y = e.clientY;
    
    // Transform to SVG coordinates
    const screenCTM = svgRef.current.getScreenCTM();
    if (!screenCTM) return;
    
    const transformedPoint = svgPoint.matrixTransform(screenCTM.inverse());
    var newWidth = currentDimensions.width;
    var newHeight = currentDimensions.height;
    var newX = boxPosition.x;
    var newY = boxPosition.y;
    var flipped = { x: false, y: false};
    
    if (activeHandle == 'right') {
      newWidth = transformedPoint.x - handlePositions.left.x;
      if (newWidth < 0) {
        newWidth = Math.abs(newWidth)
        newX = newX - newWidth;
        setActiveHandle('left')
        flipped.x = true;
      }
    }
    else if (activeHandle == 'left') {
      newX = transformedPoint.x;
      newWidth = handlePositions.right.x - transformedPoint.x;
      if (newWidth < 0) {
        newWidth = Math.abs(newWidth)
        newX = newX - newWidth;
        setActiveHandle('right')
        flipped.x = true;
      }
    }
    else if (activeHandle == 'top') {
      newY = transformedPoint.y;
      newHeight =  handlePositions.bottom.y - transformedPoint.y;
      if (newHeight < 0) {
        newHeight = Math.abs(newHeight);
        newY = newY - newHeight;
        setActiveHandle('bottom')
        flipped.y = true;
      }
    }
    else if (activeHandle == 'bottom') {
      newHeight = transformedPoint.y - handlePositions.top.y;
      if (newHeight < 0) {
        newHeight = Math.abs(newHeight);
        newY = newY - newHeight;
        setActiveHandle('top')
        flipped.y = true;
      }
    }
    else if (activeHandle == 'bottomRight') {
      newWidth = transformedPoint.x - handlePositions.topLeft.x;
      newHeight = transformedPoint.y - handlePositions.topLeft.y;
      if (newWidth < 0 && newHeight < 0) {
        newWidth = Math.abs(newWidth);
        newHeight = Math.abs(newHeight);
        newX = newX - newWidth;
        newY = newY - newHeight;
        setActiveHandle('topLeft');
        flipped = { x: true, y: true}
      } else if (newWidth < 0) {
        newWidth = Math.abs(newWidth);
        newX = newX - newWidth;
        setActiveHandle('bottomLeft');
        flipped.x = true;
      } else if (newHeight < 0) {
        newHeight = Math.abs(newHeight);
        newY = newY - newHeight;
        setActiveHandle('topRight');
        flipped.y = true;
      }
    }
    else if (activeHandle == 'bottomLeft') {
      newX = transformedPoint.x;
      newWidth = handlePositions.topRight.x - transformedPoint.x;
      newHeight = transformedPoint.y - handlePositions.topLeft.y;
      if (newWidth < 0 && newHeight < 0) {
        newWidth = Math.abs(newWidth);
        newHeight = Math.abs(newHeight);
        newX = newX - newWidth;
        newY = newY - newHeight;
        setActiveHandle('topRight');
      } else if (newWidth < 0) {
        newWidth = Math.abs(newWidth);
        newX = newX - newWidth;
        setActiveHandle('bottomRight');
      } else if (newHeight < 0) {
        newHeight = Math.abs(newHeight);
        newY = newY - newHeight;
        setActiveHandle('topLeft');
      }
    }
    else if (activeHandle == 'topRight') {
      newY = transformedPoint.y;
      newWidth = transformedPoint.x - handlePositions.topLeft.x;
      newHeight = handlePositions.bottomLeft.y - transformedPoint.y;
      if (newWidth < 0 && newHeight < 0) {
        newWidth = Math.abs(newWidth);
        newHeight = Math.abs(newHeight);
        newX = newX - newWidth;
        newY = newY - newHeight;
        setActiveHandle('bottomLeft');
      } else if (newWidth < 0) {
        newWidth = Math.abs(newWidth);
        newX = newX - newWidth;
        setActiveHandle('topLeft');
      } else if (newHeight < 0) {
        newHeight = Math.abs(newHeight);
        newY = newY - newHeight;
        setActiveHandle('bottomRight');
      }
    }
    else if (activeHandle == 'topLeft') {
      newX = transformedPoint.x;
      newY = transformedPoint.y;
      newWidth = handlePositions.bottomRight.x - transformedPoint.x;
      newHeight = handlePositions.bottomRight.y - transformedPoint.y;
      if (newWidth < 0 && newHeight < 0) {
        newWidth = Math.abs(newWidth);
        newHeight = Math.abs(newHeight);
        newX = newX - newWidth;
        newY = newY - newHeight;
        setActiveHandle('bottomRight');
      } else if (newWidth < 0) {
        newWidth = Math.abs(newWidth);
        newX = newX - newWidth;
        setActiveHandle('topRight');
      } else if (newHeight < 0) {
        newHeight = Math.abs(newHeight);
        newY = newY - newHeight;
        setActiveHandle('bottomLeft');
      }
    }

    setCurrentDimensions({
      width: newWidth,
      height: newHeight
    })

    setBoxPosition({
      x: newX,
      y: newY
    })

    updateGroupTransform(newWidth, newHeight, {x: 0, y: 0}, flipped);

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
  }, [isDragging, activeHandle, currentDimensions, boxPosition]);

  return (
    <>
      {/* Bounding Box of Active Selections */}
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
      
      {/* Resize handles for Present Bounding Box */}
      {Object.entries(handlePositions).map(([handle, pos]) => (
        <circle
          key={handle}
          cx={pos.x}
          cy={pos.y}
          r={handle.includes('-') ? 8 : 6}
          fill="#3b82f6"
          stroke="white"
          strokeWidth="2"
          cursor={handleCursors[handle]}
          onMouseDown={(e) => handleResizeStart(e, handle)}
        />
      ))}
    </>
  );
};

export default BoundingBox;