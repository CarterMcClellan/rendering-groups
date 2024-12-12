import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sliders } from './Sliders';
import { createTransformMatrix } from './math';
import { Ellipse, Group, Line, Rect, Shape, Star } from './Shape';
import { ViewportElement } from './ViewportElement';

type FixedPoint = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

const ScaleGroupDemo = () => {
  const [groupScaleX, setGroupScaleX] = useState(1);
  const [groupScaleY, setGroupScaleY] = useState(1);
  const [fixedPoint, setFixedPoint] = useState<FixedPoint>('top-left');
  
  const canvasWidth = 1000;
  const canvasHeight = 1000;
  const groupWidth = canvasWidth / 4;
  const groupHeight = canvasHeight / 4;
  const groupX = canvasWidth / 2 - groupWidth / 2;
  const groupY = canvasHeight / 2 - groupHeight / 2;
  
  const fixedPoints: Record<FixedPoint, { x: number, y: number }> = {
    'top-left': { x: groupX, y: groupY },
    'top-right': { x: groupX + groupWidth, y: groupY },
    'bottom-left': { x: groupX, y: groupY + groupHeight },
    'bottom-right': { x: groupX + groupWidth, y: groupY + groupHeight }
  };

  const fixedPointX = fixedPoints[fixedPoint].x;
  const fixedPointY = fixedPoints[fixedPoint].y;

  const transformMatrix = createTransformMatrix(groupScaleX, groupScaleY, fixedPointX, fixedPointY);
 
  // Create matrices
  const groupMatrix = new Group({x: groupX, y: groupY, width: groupWidth, height: groupHeight});
  
  const lineLen = 30;
  const innerShapes: Shape[] = [
    new Rect({x: groupX, y: groupY, width: 40, height: 40}),
    new Ellipse({cx: groupX + groupWidth/2, cy: groupY + groupHeight/2, rx: 20, ry: 20}),
    new Line({x1: groupX + groupWidth - lineLen, y1: groupY + groupHeight - lineLen, x2: groupX + groupWidth, y2: groupY + groupHeight}),
    new Star({cx: groupX + 20, cy: groupY + groupHeight - 20, outerRadiusX: 20, outerRadiusY: 20})
  ];

  // Transform inner shapes using the same matrix
  const transformedInnerShapes = innerShapes.map(shape => {
    return shape.transform(transformMatrix);
  });

  // Transform group
  const transformedGroup = groupMatrix.transform(transformMatrix);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Scale Group Demo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Fixed Point</label>
            {/* @ts-ignore */}
            <Select value={fixedPoint} onValueChange={setFixedPoint}>
              <SelectTrigger>
                <SelectValue placeholder="Select fixed point" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="top-left">Top Left</SelectItem>
                <SelectItem value="top-right">Top Right</SelectItem>
                <SelectItem value="bottom-left">Bottom Left</SelectItem>
                <SelectItem value="bottom-right">Bottom Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-medium">Group Scale</h3>
            <Sliders 
              scaleX={groupScaleX} 
              scaleY={groupScaleY} 
              setScaleX={setGroupScaleX} 
              setScaleY={setGroupScaleY} 
            />
          </div>

          <svg 
            viewBox={`0 0 ${canvasWidth} ${canvasHeight}`} 
            className="w-full border rounded bg-white"
          >
            {/* Original group */}
            <g>
              <ViewportElement 
                shape={groupMatrix}
                color="blue"
                opacity={0.3}
                stroke="blue"
                strokeWidth={1}
              />

              {innerShapes.map((shape, index) => (
                <ViewportElement 
                  shape={shape}
                  color="blue"
                  opacity={0.3}
                  stroke="blue"
                  strokeWidth={1}
                />
              ))}
            </g>

            {/* Transformed group */}
            <g>
              <ViewportElement 
                shape={transformedGroup}
                opacity={0.3}
                stroke="green"
                strokeWidth={1}
                color="green"
              />
              
              {transformedInnerShapes.map((shape, index) => (
                <ViewportElement 
                  shape={shape}
                  color="green"
                  opacity={0.3}
                  stroke="green"
                  strokeWidth={1}
                />
              ))}
            </g>

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

export default ScaleGroupDemo;