import React, { useState, useEffect, useRef } from 'react';
import { Dimensions, Flipped, GroupTransform, Position, Scale } from '../types';

interface BoundingBoxProps {
  groupDimensions: Dimensions;
  groupPosition: Position;
  setCurrentGroupTransform: (transform: GroupTransform | null) => void;
  svgRef: React.RefObject<SVGSVGElement>;
}

const BoundingBox: React.FC<BoundingBoxProps> = ({
  groupDimensions,
  groupPosition,
  setCurrentGroupTransform,
  svgRef
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  
  // State to track current dimensions and position
  const [initialDimension, setInitialDimensions] = useState<Dimensions>(groupDimensions);
  const [currentDimensions, setCurrentDimensions] = useState<Dimensions>(groupDimensions);
  const [initialPosition, setInitialPosition] = useState<Position>(groupPosition)
  const [boxPosition, setBoxPosition] = useState<Position>(groupPosition);
  const flipped = useRef<Flipped>({x: 1, y: 1});
  
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

  const updateGroupTransform = ({d, p, f}: {d: Dimensions, p: Position, f: Flipped}) => {
    const scaleX = Math.abs(d.width) / initialDimension.width;
    const scaleY = Math.abs(d.height) / initialDimension.height;
    const deltaX = p.x - initialPosition.x;
    const deltaY = p.y - initialPosition.y;
    setCurrentGroupTransform({
      scale: {x: scaleX, y: scaleY},
      position: {x: deltaX, y: deltaY},
      flipped: f 
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

    if (activeHandle == 'right') {
      newWidth = transformedPoint.x - handlePositions.left.x;
      if (newWidth < 0) {
        newWidth = Math.abs(newWidth)
        newX = newX - newWidth;
        setActiveHandle('left')
        flipped.current.x = -1;
      }
    }
    else if (activeHandle == 'left') {
      newX = transformedPoint.x;
      newWidth = handlePositions.right.x - transformedPoint.x;
      if (newWidth < 0) {
        newWidth = Math.abs(newWidth)
        newX = newX - newWidth;
        setActiveHandle('right')
        flipped.current.x = -1;
      }
    }
    else if (activeHandle == 'top') {
      // the top of the box will be wherever the cursor moves to
      newY = transformedPoint.y; 

      // the height will be the difference between the bottom and the
      // newY
      newHeight =  handlePositions.bottom.y - newY;

      // imagine the box shrunk by moving the top handle down, we are going
      // to scale the points inside by the amount the box shrunk, but we are also
      // going to translate the points by whatever amount we just shrunk the box
      if (newHeight < 0) {
        newHeight = Math.abs(newHeight);
        newY = newY - newHeight;
        setActiveHandle('bottom')
        flipped.current.y = -1;
      }
    }
    else if (activeHandle == 'bottom') {
      newHeight = transformedPoint.y - handlePositions.top.y;
      if (newHeight < 0) {
        newHeight = Math.abs(newHeight);
        newY = newY - newHeight;
        setActiveHandle('top')
        flipped.current.y = -1;
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
        flipped.current = { x: -1, y: -1}
      } else if (newWidth < 0) {
        newWidth = Math.abs(newWidth);
        newX = newX - newWidth;
        setActiveHandle('bottomLeft');
        flipped.current.x = -1;
      } else if (newHeight < 0) {
        newHeight = Math.abs(newHeight);
        newY = newY - newHeight;
        setActiveHandle('topRight');
        flipped.current.y = -1;
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

    updateGroupTransform({
      d: {width: newWidth, height: newHeight}, 
      p: {x: newX, y: newY}, 
      f: flipped.current
    });
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