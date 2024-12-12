import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sliders } from './Sliders';
import { createTransformMatrix, multiplyMatrix, rectToMatrix, matrixToSvgProps } from './math';

const MatrixRectTransform = () => {
  const [scaleX, setScaleX] = useState(1);
  const [scaleY, setScaleY] = useState(1);
  const [fixedPoint, setFixedPoint] = useState('bottom-right');
  
  // Original rectangle dimensions
  const canvasWidth = 1000;
  const canvasHeight = 1000;
  const originalWidth = canvasWidth / 4;
  const originalHeight = canvasHeight / 4;
  const originalX = canvasWidth / 2 - originalWidth / 2;
  const originalY = canvasHeight / 2 - originalHeight / 2;
  
  // Calculate fixed points
  const fixedPoints = {
    'top-left': { x: originalX, y: originalY },
    'top-right': { x: originalX + originalWidth, y: originalY },
    'bottom-left': { x: originalX, y: originalY + originalHeight },
    'bottom-right': { x: originalX + originalWidth, y: originalY + originalHeight }
  };

  // Get selected fixed point coordinates
  const fixedPointX = fixedPoints[fixedPoint].x;
  const fixedPointY = fixedPoints[fixedPoint].y;
  
  // Create matrices
  const originalRectMatrix = rectToMatrix(originalX, originalY, originalWidth, originalHeight);
  const transformMatrix = createTransformMatrix(scaleX, scaleY, fixedPointX, fixedPointY);
  
  // Apply transformation
  const transformedRectMatrix = multiplyMatrix(transformMatrix, originalRectMatrix);
  
  // Convert back to SVG properties
  const transformedProps = matrixToSvgProps(transformedRectMatrix);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Matrix Transform Demo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Fixed Point</label>
              <Select value={fixedPoint} onValueChange={setFixedPoint}>
                <SelectTrigger>
                  <SelectValue placeholder="Select fixed point" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top-left">Top Left</SelectItem>
                  <SelectItem value="top-right">Top Right</SelectItem>
                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          
          <Sliders 
            scaleX={scaleX} 
            scaleY={scaleY} 
            setScaleX={setScaleX} 
            setScaleY={setScaleY} 
          />

          <svg 
            viewBox={`0 0 ${canvasWidth} ${canvasHeight}`} 
            className="w-full border rounded bg-white"
          >
            {/* Original rectangle */}
            <rect
              x={originalX}
              y={originalY}
              width={originalWidth}
              height={originalHeight}
              fill="none"
              stroke="blue"
              strokeWidth="2"
            />
            
            {/* Transformed rectangle */}
            <rect
              {...transformedProps}
              fill="none"
              stroke="green"
              strokeWidth="2"
              strokeDasharray="5,5"
            />

            {/* Fixed point */}
            <circle
              cx={fixedPointX}
              cy={fixedPointY}
              r="5"
              fill="red"
            />
            
          </svg>

        </div>
      </CardContent>
    </Card>
  );
};

export default MatrixRectTransform;