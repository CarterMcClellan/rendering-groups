import React, { useState, useEffect } from 'react';
import { Dimensions, GroupTransform, Position } from '../types';

interface BoundingBoxProps {
  initialGroupDimensions: Dimensions;
  initialGroupPosition: Position;
  setCurrentGroupTransform: (transform: GroupTransform | null) => void;
  svgRef: React.RefObject<SVGSVGElement>;
}

const BoundingBox: React.FC<BoundingBoxProps> = ({
  initialGroupDimensions,
  initialGroupPosition,
  setCurrentGroupTransform,
  svgRef
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  
  // State to track current dimensions
  const [currentDimensions, setCurrentDimensions] = useState<Dimensions>(initialGroupDimensions);
  const [boxPosition, setBoxPosition] = useState<Position>(initialGroupPosition);
  const [isFlipped, setIsFlipped] = useState({ x: false, y: false });

  // Initialize position and dimensions when initialGroupDimensions changes
  useEffect(() => {
    setCurrentDimensions(initialGroupDimensions);
    setBoxPosition(initialGroupPosition);
    setIsFlipped({ x: false, y: false });
  }, [initialGroupDimensions, initialGroupPosition]);
  
  // Calculate the bounding box coordinates
  const boxX = boxPosition.x + (isFlipped.x ? currentDimensions.width : 0);
  const boxY = boxPosition.y + (isFlipped.y ? currentDimensions.height : 0);
  const boxWidth = Math.abs(currentDimensions.width);
  const boxHeight = Math.abs(currentDimensions.height);
  
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
  const handleCursors: Record<string, string> = {
    right: 'ew-resize',
    bottom: 'ns-resize',
    left: 'ew-resize',
    top: 'ns-resize',
    'bottom-right': 'nwse-resize',
    'bottom-left': 'nesw-resize',
    'top-right': 'nesw-resize',
    'top-left': 'nwse-resize'
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
  
  // Calculate group transform from current dimensions
  const updateGroupTransform = (newWidth: number, newHeight: number, newPosition: Position, newFlipped: { x: boolean, y: boolean }) => {
    // Calculate scale factors based on dimension changes
    const scaleX = newFlipped.x ? -newWidth / initialGroupDimensions.width : newWidth / initialGroupDimensions.width;
    const scaleY = newFlipped.y ? -newHeight / initialGroupDimensions.height : newHeight / initialGroupDimensions.height;
    
    // Calculate position adjustment based on original position
    // this should be the "fixed point" which is based on which resize handle is being dragged
    // TODO: fix
    const x = initialGroupPosition.x;
    const y = initialGroupPosition.y;

    // Update the group transform
    setCurrentGroupTransform({
      scaleX,
      scaleY,
      x,
      y
    });
  };
  
  // Handle resize during drag
  const handleResize = (e: MouseEvent) => {
    if (!isDragging || !svgRef.current || !activeHandle) return;
    
    const svgPoint = svgRef.current.createSVGPoint();
    svgPoint.x = e.clientX;
    svgPoint.y = e.clientY;
    
    // Transform to SVG coordinates
    const screenCTM = svgRef.current.getScreenCTM();
    if (!screenCTM) return;
    
    const transformedPoint = svgPoint.matrixTransform(screenCTM.inverse());
    
    // Calculate new dimensions based on which handle is being dragged
    let newWidth = currentDimensions.width;
    let newHeight = currentDimensions.height;
    let newX = boxPosition.x;
    let newY = boxPosition.y;
    let newFlippedX = isFlipped.x;
    let newFlippedY = isFlipped.y;
    
    // Calculate the actual corner points based on current state
    const startX = isFlipped.x ? boxPosition.x + currentDimensions.width : boxPosition.x;
    const startY = isFlipped.y ? boxPosition.y + currentDimensions.height : boxPosition.y;
    const endX = isFlipped.x ? boxPosition.x : boxPosition.x + currentDimensions.width;
    const endY = isFlipped.y ? boxPosition.y : boxPosition.y + currentDimensions.height;
    
    switch (activeHandle) {
      case 'right':
        newWidth = transformedPoint.x - startX;
        newFlippedX = newWidth < 0;
        break;
      case 'bottom':
        newHeight = transformedPoint.y - startY;
        newFlippedY = newHeight < 0;
        break;
      case 'left':
        newWidth = endX - transformedPoint.x;
        newX = transformedPoint.x;
        newFlippedX = newWidth < 0;
        break;
      case 'top':
        newHeight = endY - transformedPoint.y;
        newY = transformedPoint.y;
        newFlippedY = newHeight < 0;
        break;
      case 'bottom-right':
        newWidth = transformedPoint.x - startX;
        newHeight = transformedPoint.y - startY;
        newFlippedX = newWidth < 0;
        newFlippedY = newHeight < 0;
        break;
      case 'bottom-left':
        newWidth = endX - transformedPoint.x;
        newHeight = transformedPoint.y - startY;
        newX = transformedPoint.x;
        newFlippedX = newWidth < 0;
        newFlippedY = newHeight < 0;
        break;
      case 'top-right':
        newWidth = transformedPoint.x - startX;
        newHeight = endY - transformedPoint.y;
        newY = transformedPoint.y;
        newFlippedX = newWidth < 0;
        newFlippedY = newHeight < 0;
        break;
      case 'top-left':
        newWidth = endX - transformedPoint.x;
        newHeight = endY - transformedPoint.y;
        newX = transformedPoint.x;
        newY = transformedPoint.y;
        newFlippedX = newWidth < 0;
        newFlippedY = newHeight < 0;
        break;
    }
    
    // Set minimum size
    const minSize = 10;
    const absWidth = Math.max(minSize, Math.abs(newWidth));
    const absHeight = Math.max(minSize, Math.abs(newHeight));
    
    // Update current dimensions
    setCurrentDimensions({ width: absWidth, height: absHeight });
    setBoxPosition({ x: newX, y: newY });
    setIsFlipped({ x: newFlippedX, y: newFlippedY });
    
    // Update the group transform
    updateGroupTransform(absWidth, absHeight, { x: newX, y: newY }, { x: newFlippedX, y: newFlippedY });
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
  }, [isDragging, activeHandle, currentDimensions, boxPosition, isFlipped]);

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