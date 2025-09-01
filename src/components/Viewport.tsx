import { useState, useRef, useEffect } from 'react';
import { ViewportElement } from './ViewportElement';
import { PolygonShape, Shape, ShapeBoundingBox } from './Shape';
import BoundingBox from './BoundingBox';
import { computeDimensionsFromBoundingBoxes } from '../utils';
import { GroupTransform, Dimensions, Position, Flipped, Scale } from '../types';

// Sample shapes as a map from ID to Shape object
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 800;

const START_SHAPES = new Map<string, Shape>([
  ["1", new PolygonShape({ id: "1", x: 200, y: 200, sideLength: 200, sides: 5, fill: "#ff6347", stroke: "black", strokeWidth: 2 })],
  // ["2", new PolygonShape({ id: "2", x: 300, y: 300, sideLength: 100, sides: 4, fill: "pink", stroke: "black", strokeWidth: 1 })],
]);

const Viewport = () => {
  // Change to separate state variables
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]);
  const [groupDimensions, setGroupDimensions] = useState<Dimensions | null>(null);
  const [groupPosition, setGroupPosition] = useState<Position | null>(null);
  const [currentGroupTransform, setCurrentGroupTransform] = useState<GroupTransform | null>(null);
  const [shapesMap, setShapesMap] = useState<Map<string, Shape>>(START_SHAPES);
  const svgRef = useRef(null); // reference to the canvas itself

  useEffect(() => {
    if (currentGroupTransform && selectedShapeIds.length > 0) {
      const newShapesMap = new Map(shapesMap);
      selectedShapeIds.forEach(id => {
        const currentShape = shapesMap.get(id);
        if (currentShape != undefined) {
          const newShape = currentShape.update(currentGroupTransform);
          newShapesMap.set(id, newShape)
        }
      });
      setShapesMap(newShapesMap); // hack: force re-render (this breaks the bounding box update)
    }
  }, [currentGroupTransform, selectedShapeIds]);


  useEffect(() => {
    if (selectedShapeIds.length === 0) {
      setGroupDimensions(null);
      setGroupPosition(null);
      setCurrentGroupTransform(null);
      return;
    }

    const boundingBoxes = selectedShapeIds.map((shapeId) => {
      const shape = shapesMap.get(shapeId);
      return shape ? shape.getBoundingBox() : null;
    }).filter(bbox => bbox !== null) as Array<ShapeBoundingBox>;

    const dimensionsData = computeDimensionsFromBoundingBoxes(boundingBoxes);
    
    if (!dimensionsData) return;
    
    setGroupDimensions(dimensionsData.dimensions);
    setGroupPosition(dimensionsData.fixedAnchor);
  }, [selectedShapeIds]);

  return (
    <div className="flex flex-col items-center p-8">
      <div className="mb-4">
        <p className="text-lg font-semibold">Drag any handle to resize or flip the shapes</p>
        <p>Selected Shapes: {selectedShapeIds.join(', ') || ''}</p>
      </div>
      
      <svg 
        ref={svgRef}
        width={CANVAS_WIDTH} 
        height={CANVAS_HEIGHT} 
        className="border border-gray-300 bg-gray-50"
      >
        {/* Viewport Elements */}
        {Array.from(shapesMap.values()).map((shape) => (
          <ViewportElement 
            key={shape.id}
            shape={shape}
            isSelected={selectedShapeIds.includes(shape.id) || false}
            onClick={() => {
              if (selectedShapeIds.includes(shape.id)) {
                setSelectedShapeIds(selectedShapeIds.filter(id => id !== shape.id));
              } else {
                setSelectedShapeIds([...selectedShapeIds, shape.id]);
              }
            }}
          />
        ))}
        
        {groupDimensions && groupPosition && selectedShapeIds.length > 0 && (
          <BoundingBox
            groupDimensions={groupDimensions}
            groupPosition={groupPosition}
            setCurrentGroupTransform={setCurrentGroupTransform}
            svgRef={svgRef}
          />
        )}
      </svg>
      
      <div className="mt-4">
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
          onClick={() => {
            setSelectedShapeIds([]);
            setGroupDimensions(null);
            setGroupPosition(null);
            setCurrentGroupTransform(null);
            setShapesMap(START_SHAPES);
          }}
        >
          Reset
        </button>
        <button 
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 mr-2"
          onClick={() => {
            setSelectedShapeIds(Array.from(shapesMap.keys()));
          }}
        >
          Select All
        </button>
        <button
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          onClick={() => {
            setSelectedShapeIds([]);
          }}
        >
          De-select All
        </button>
      </div>
    </div>
  );
};

export default Viewport;