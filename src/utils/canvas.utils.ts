import type { Point, Polygon, BoundingBox } from '../types/canvas.types';

export const parsePoints = (pointsString: string): Point[] =>
  pointsString.split(' ').map(pair => {
    const [x, y] = pair.split(',').map(Number);
    return { x, y };
  });

export const stringifyPoints = (pointsArray: Point[]): string =>
  pointsArray.map(p => `${p.x},${p.y}`).join(' ');

export const clientToSVGCoords = (e: MouseEvent, svgRef: React.RefObject<SVGSVGElement>): Point => {
  const svgPoint = svgRef.current!.createSVGPoint();
  svgPoint.x = e.clientX;
  svgPoint.y = e.clientY;
  return svgPoint.matrixTransform(svgRef.current!.getScreenCTM()!.inverse());
};

export const transformPoint = (
  point: Point,
  scaleX: number,
  scaleY: number,
  translateX: number,
  translateY: number
): Point => ({
  x: translateX + point.x * scaleX,
  y: translateY + point.y * scaleY,
});

export const transformPolygons = (
  polygons: Polygon[],
  scaleX: number,
  scaleY: number,
  translateX: number,
  translateY: number
): Polygon[] =>
  polygons.map(polygon => ({
    ...polygon,
    points: stringifyPoints(
      parsePoints(polygon.points).map(p => transformPoint(p, scaleX, scaleY, translateX, translateY))
    )
  }));

export const calculateBoundingBox = (polygonList: Polygon[]): BoundingBox => {
  const allPoints = polygonList.flatMap(polygon => parsePoints(polygon.points));
  const xs = allPoints.map(p => p.x);
  const ys = allPoints.map(p => p.y);

  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
};

export const convertToLocalCoordinates = (polygons: Polygon[], bbox: BoundingBox): Polygon[] =>
  polygons.map(polygon => ({
    ...polygon,
    points: stringifyPoints(
      parsePoints(polygon.points).map(p => ({ x: p.x - bbox.x, y: p.y - bbox.y }))
    )
  }));
