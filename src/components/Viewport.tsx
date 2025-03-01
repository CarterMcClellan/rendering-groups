import { useState, useRef, useEffect } from 'react';
import { ViewportElement } from './ViewportElement';
import { PolygonShape, Shape, ShapeBoundingBox, ShapeTransform } from './Shape';
import BoundingBox from './BoundingBox';
import { computeDimensionsFromBoundingBoxes } from '../utils';
import { GroupTransform, Dimensions, Position } from '../types';

// Sample shapes as a map from ID to Shape object
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 800;
const MID_X = CANVAS_WIDTH / 2 - 100;
const MID_Y = CANVAS_HEIGHT / 2 - 100;

const START_SHAPES = new Map<string, Shape>([
  ["1", new PolygonShape({ id: "1", top: MID_Y, left: MID_X, sideLength: 60, sides: 3, fill: "#ff6347", stroke: "black", strokeWidth: 1 })],
  ["2", new PolygonShape({ id: "2", top: MID_Y+80, left: MID_X, sideLength: 60, sides: 3, fill: "#4682b4", stroke: "black", strokeWidth: 1 })],
  ["3", new PolygonShape({ id: "3", top: MID_Y, left: MID_X+80, sideLength: 80, sides: 3, fill: "#9acd32", stroke: "black", strokeWidth: 1 })]
]);

const Viewport = () => {
  // Change to separate state variables
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]);
  const [initialGroupDimensions, setInitialGroupDimensions] = useState<Dimensions | null>(null);
  const [initialGroupPosition, setInitialGroupPosition] = useState<Position | null>(null);
  const [currentGroupTransform, setCurrentGroupTransform] = useState<GroupTransform | null>(null);

  const [shapesMap, setShapesMap] = useState<Map<string, Shape>>(START_SHAPES);
  const [shapeTransforms, setShapeTransforms] = useState<Map<string, ShapeTransform>>(new Map());

  useEffect(() => {
    if (currentGroupTransform && selectedShapeIds.length > 0) {
      const newTransforms = new Map<string, ShapeTransform>();
      
      selectedShapeIds.forEach(id => {
        // Get existing transform or create a new one
        const existingTransform = shapeTransforms.get(id) || new ShapeTransform();
        
        // Apply the current group transform
        const newTransform = existingTransform.updateTransform(currentGroupTransform);
        newTransforms.set(id, newTransform);
      });
      
      setShapeTransforms(newTransforms);
    }
  }, [currentGroupTransform, selectedShapeIds]);

  const svgRef = useRef(null);
  const shapesArray = Array.from(shapesMap.values());

  const calculateGroupProperties = () => {
    if (selectedShapeIds.length === 0) {
      setInitialGroupDimensions(null);
      setInitialGroupPosition(null);
      setCurrentGroupTransform(null);
      return;
    }

    const boundingBoxes = selectedShapeIds.map((shapeId) => {
      const shape = shapesMap.get(shapeId);
      return shape ? shape.getBoundingBox() : null;
    }).filter(bbox => bbox !== null) as Array<ShapeBoundingBox>;

    const dimensionsData = computeDimensionsFromBoundingBoxes(boundingBoxes);
    
    if (!dimensionsData) return;
    
    setInitialGroupDimensions(dimensionsData.dimensions);
    setInitialGroupPosition(dimensionsData.fixedAnchor);
  };

  useEffect(() => {
    calculateGroupProperties();
  }, [selectedShapeIds, shapesMap]);
  
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
        {shapesArray.map((shape) => (
          <ViewportElement 
            key={shape.id}
            shape={shape}
            shapeTransform={shapeTransforms.get(shape.id) || null}
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
        
        {initialGroupDimensions && initialGroupPosition && selectedShapeIds.length > 0 && (
          <BoundingBox
            initialGroupDimensions={initialGroupDimensions}
            initialGroupPosition={initialGroupPosition}
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
            setInitialGroupDimensions(null);
            setInitialGroupPosition(null);
            setCurrentGroupTransform(null);
            setShapesMap(START_SHAPES);
            setShapeTransforms(new Map());
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