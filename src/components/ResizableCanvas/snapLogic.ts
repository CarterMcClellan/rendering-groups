import { BoundingBox, Guideline, Polygon } from './types';

interface SnapResult {
  translation: { x: number; y: number };
  guidelines: Guideline[];
}

// Helper to check snap
const checkSnap = (
    value: number,
    target: number,
    type: 'vertical' | 'horizontal',
    start: number,
    end: number,
    threshold: number,
    currentMinDist: number
  ) => {
    const dist = Math.abs(value - target);
    if (dist < currentMinDist && dist < threshold) {
      return { 
        dist, 
        snapDelta: target - value, 
        match: { type, pos: target, start, end } 
      };
    }
    return null;
  };
  
  export const calculateSnap = (
    proposedBox: BoundingBox,
    polygons: Polygon[],
    excludedIds: number[],
    canvasWidth: number,
    canvasHeight: number,
    threshold: number
  ): SnapResult => {
    
    // Filter and calculate boxes for other polygons
    const otherBoxes = polygons
      .map((p, i) => ({ p, i }))
      .filter(({ i }) => !excludedIds.includes(i))
      .map(({ p }) => {
        // Simplified bounding box calculation for testability/reuse if points are strings
        const points = p.points.split(' ').flatMap(pair => {
            const [x, y] = pair.split(',').map(Number);
            return [{x, y}];
        });
        const xs = points.map(pt => pt.x);
        const ys = points.map(pt => pt.y);
        return {
            x: Math.min(...xs),
            y: Math.min(...ys),
            width: Math.max(...xs) - Math.min(...xs),
            height: Math.max(...ys) - Math.min(...ys),
        } as BoundingBox;
      });
  
    // Add canvas edges
    otherBoxes.push(
      { x: 0, y: 0, width: canvasWidth, height: canvasHeight }
    );
  
    const newGuidelines: Guideline[] = [];
    let snapDeltaX = 0;
    let snapDeltaY = 0;
    let minDistX = threshold;
    let minDistY = threshold;
  
    const edgesX = [
      { val: proposedBox.x, type: 'start' }, 
      { val: proposedBox.x + proposedBox.width / 2, type: 'center' }, 
      { val: proposedBox.x + proposedBox.width, type: 'end' }
    ];
    const edgesY = [
      { val: proposedBox.y, type: 'start' }, 
      { val: proposedBox.y + proposedBox.height / 2, type: 'center' }, 
      { val: proposedBox.y + proposedBox.height, type: 'end' }
    ];
  
    type SnapMatch = { target: number, start: number, end: number };
    let bestXMatch: SnapMatch | null = null;
    let bestYMatch: SnapMatch | null = null;
  
    for (const target of otherBoxes) {
        const tX = [target.x, target.x + target.width / 2, target.x + target.width];
        const tY = [target.y, target.y + target.height / 2, target.y + target.height];
  
        // Vertical Guides (Horizontal movement)
        for (const edge of edgesX) {
            for (const targetVal of tX) {
                const result = checkSnap(edge.val, targetVal, 'vertical', 
                    Math.min(proposedBox.y, target.y), 
                    Math.max(proposedBox.y + proposedBox.height, target.y + target.height),
                    threshold,
                    minDistX
                );

                if (result) {
                    minDistX = result.dist;
                    snapDeltaX = result.snapDelta;
                    bestXMatch = { 
                        target: result.match.pos, 
                        start: result.match.start,
                        end: result.match.end
                    };
                }
            }
        }
  
        // Horizontal Guides (Vertical movement)
        for (const edge of edgesY) {
            for (const targetVal of tY) {
                const result = checkSnap(edge.val, targetVal, 'horizontal',
                    Math.min(proposedBox.x, target.x),
                    Math.max(proposedBox.x + proposedBox.width, target.x + target.width),
                    threshold,
                    minDistY
                );

                if (result) {
                    minDistY = result.dist;
                    snapDeltaY = result.snapDelta;
                    bestYMatch = { 
                        target: result.match.pos, 
                        start: result.match.start,
                        end: result.match.end
                    };
                }
            }
        }
    }
  
    if (bestXMatch) {
        newGuidelines.push({ type: 'vertical', pos: bestXMatch.target, start: bestXMatch.start, end: bestXMatch.end });
    }
    if (bestYMatch) {
        newGuidelines.push({ type: 'horizontal', pos: bestYMatch.target, start: bestYMatch.start, end: bestYMatch.end });
    }
  
    return {
        translation: { x: snapDeltaX, y: snapDeltaY },
        guidelines: newGuidelines
    };
  };
