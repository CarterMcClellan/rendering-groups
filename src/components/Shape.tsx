import { Matrix, multiplyMatrix } from "./math";

export abstract class Shape {
  abstract transform(matrix: Matrix): Shape;
  abstract toMatrix(): Matrix;
  abstract matrixToProps(matrix: Matrix): any;
  abstract toSvgStr(fill: string, opacity: number, stroke: string, strokeWidth: number): string;
};

export class Group extends Shape {
    x: number;
    y: number;
    width: number;
    height: number;

  constructor({x, y, width, height}: {x: number, y: number, width: number, height: number}) {
    super();
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  transform(transformMatrix: Matrix): Group {
    const transformedMatrix = multiplyMatrix(transformMatrix, this.toMatrix());
    const { x, y, width, height } = this.matrixToProps(transformedMatrix);
    return new Group({x, y, width, height});
  }

  toMatrix(): Matrix {
    return [
      [this.x, this.x + this.width, this.x + this.width, this.x],
      [this.y, this.y, this.y + this.height, this.y + this.height],
      [1, 1, 1, 1]
    ];
  }

  matrixToProps(matrix: Matrix): { x: number, y: number, width: number, height: number } {
    const x = Math.min(...matrix[0]);
    const y = Math.min(...matrix[1]);
    const maxX = Math.max(...matrix[0]);
    const maxY = Math.max(...matrix[1]);
    return { x, y, width: maxX - x, height: maxY - y };
  }

  toSvgStr(fill: string, opacity: number, stroke: string, strokeWidth: number): string {
    return `<rect
        x="${this.x}"
        y="${this.y}"
        width="${this.width}"
        height="${this.height}"
        fill="none"
        stroke="${stroke}"
        strokeWidth="${strokeWidth}"
    />`
  }
}

export class Rect extends Shape {
  x: number;
  y: number;
  width: number;
  height: number;

  constructor({x, y, width, height}: {x: number, y: number, width: number, height: number}) {
    super();
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  transform(transformMatrix: Matrix): Rect {
    const transformedMatrix = multiplyMatrix(transformMatrix, this.toMatrix());
    const { x, y, width, height } = this.matrixToProps(transformedMatrix);
    return new Rect({x, y, width, height});
  }

  toMatrix(): Matrix {
    return [
      [this.x, this.x + this.width, this.x + this.width, this.x],
      [this.y, this.y, this.y + this.height, this.y + this.height],
      [1, 1, 1, 1]
    ];
  }

  matrixToProps(matrix: Matrix): { x: number, y: number, width: number, height: number } {
    const x = Math.min(...matrix[0]);
    const y = Math.min(...matrix[1]);
    const maxX = Math.max(...matrix[0]);
    const maxY = Math.max(...matrix[1]);
    
    return {
        x,
        y,
        width: maxX - x,
        height: maxY - y
    };
  }

  toSvgStr(fill: string, opacity: number, stroke: string, strokeWidth: number): string {
    return `<rect 
      x="${this.x}"
      y="${this.y}"
      width="${this.width}"
      height="${this.height}" 
      fill="${fill}"
      opacity="${opacity}"
      stroke="${stroke}"
      strokeWidth="${strokeWidth}"
    />`;
  }
}


export class Ellipse extends Shape {
  cx: number;
  cy: number;
  rx: number;
  ry: number;

  constructor({cx, cy, rx, ry}: {cx: number, cy: number, rx: number, ry: number}) {
    super();
    this.cx = cx;
    this.cy = cy;
    this.rx = rx;
    this.ry = ry;
  }

  transform(transformMatrix: Matrix): Ellipse {
    const transformedMatrix = multiplyMatrix(transformMatrix, this.toMatrix());
    const { cx, cy, rx, ry } = this.matrixToProps(transformedMatrix);
    return new Ellipse({cx, cy, rx, ry});
  }

  toMatrix(): Matrix {
    return [
      [this.cx, this.cx + this.rx, this.cx + this.rx, this.cx],
      [this.cy, this.cy, this.cy + this.ry, this.cy + this.ry],
      [1, 1, 1, 1]
    ];
  }

  matrixToProps(matrix: Matrix): { cx: number, cy: number, rx: number, ry: number } {
    const cx = Math.min(...matrix[0]);
    const cy = Math.min(...matrix[1]);
    const rx = Math.max(...matrix[0]) - cx;
    const ry = Math.max(...matrix[1]) - cy;
    return { cx, cy, rx, ry };
  }

  toSvgStr(fill: string, opacity: number, stroke: string, strokeWidth: number): string {
    return `<ellipse 
      cx="${this.cx}"
      cy="${this.cy}"
      rx="${this.rx}"
      ry="${this.ry}" 
      fill="${fill}"
      opacity="${opacity}"
      stroke="${stroke}"
      strokeWidth="${strokeWidth}"
    />`;
 };
}

export class Line extends Shape {
  x1: number;
  y1: number;
  x2: number;
  y2: number;

  constructor({x1, y1, x2, y2}: {x1: number, y1: number, x2: number, y2: number}) {
    super();
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
  }

  transform(transformMatrix: Matrix): Line {
    const transformedMatrix = multiplyMatrix(transformMatrix, this.toMatrix());
    const { x1, y1, x2, y2 } = this.matrixToProps(transformedMatrix);
    return new Line({x1, y1, x2, y2});
  }

  toMatrix(): Matrix {
    return [
      [this.x1, this.x2, this.x2, this.x1],
      [this.y1, this.y2, this.y2, this.y1],
      [1, 1, 1, 1]
    ];
  }

  matrixToProps(matrix: Matrix): { x1: number, y1: number, x2: number, y2: number } {
    const x1 = Math.min(...matrix[0]);
    const y1 = Math.min(...matrix[1]);
    const x2 = Math.max(...matrix[0]);
    const y2 = Math.max(...matrix[1]);
    return { x1, y1, x2, y2 };
  }

  toSvgStr(fill: string, opacity: number, stroke: string, strokeWidth: number): string {
    return `<line 
      x1="${this.x1}"
      y1="${this.y1}"
      x2="${this.x2}"
      y2="${this.y2}"
      stroke="${stroke}"
      strokeWidth="${strokeWidth}"
    />`;
  }
}