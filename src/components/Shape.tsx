import { Matrix, multiplyMatrix } from "./math";

export abstract class Shape {
  abstract transform(matrix: Matrix): Shape;
  abstract matrixToProps(matrix: Matrix): any;
  abstract toSvgStr(fill: string, opacity: number, stroke: string, strokeWidth: number): string;
  abstract getBbox(): { x1: number, y1: number, x2: number, y2: number, width: number, height: number };

  toMatrix(): Matrix {
    const { x1, y1, x2, y2 } = this.getBbox();
    return [
      [x1, x2, x2, x1],
      [y1, y2, y2, y1],
      [1, 1, 1, 1]
    ];
  }
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

  getBbox(): { x1: number, y1: number, x2: number, y2: number, width: number, height: number } {
    return { x1: this.x, y1: this.y, x2: this.x + this.width, y2: this.y + this.height, width: this.width, height: this.height };
  }

  transform(transformMatrix: Matrix): Group {
    const transformedMatrix = multiplyMatrix(transformMatrix, this.toMatrix());
    const { x, y, width, height } = this.matrixToProps(transformedMatrix);
    return new Group({x, y, width, height});
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

  getBbox(): { x1: number, y1: number, x2: number, y2: number, width: number, height: number } {
    return { x1: this.x, y1: this.y, x2: this.x + this.width, y2: this.y + this.height, width: this.width, height: this.height };
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

  getBbox(): { x1: number, y1: number, x2: number, y2: number, width: number, height: number } {
    return { x1: this.cx - this.rx, y1: this.cy - this.ry, x2: this.cx + this.rx, y2: this.cy + this.ry, width: this.rx * 2, height: this.ry * 2 };
  }

  matrixToProps(matrix: Matrix): { cx: number, cy: number, rx: number, ry: number } {
      // Calculate center as average of all x and y coordinates
      const cx = matrix[0].reduce((a, b) => a + b, 0) / matrix[0].length;
      const cy = matrix[1].reduce((a, b) => a + b, 0) / matrix[1].length;
      
      // Calculate radii as half the difference between max and min
      const rx = (Math.max(...matrix[0]) - Math.min(...matrix[0])) / 2;
      const ry = (Math.max(...matrix[1]) - Math.min(...matrix[1])) / 2;
      
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

  getBbox(): { x1: number, y1: number, x2: number, y2: number, width: number, height: number } {
    return {
      x1: this.x1,
      y1: this.y1,
      x2: this.x2,
      y2: this.y2,
      width: 0,
      height: 0
    }
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

export class Star extends Shape {
  outerRadiusX: number;
  outerRadiusY: number;
  innerRadiusX: number;
  innerRadiusY: number;
  cx: number;
  cy: number;

  constructor({cx, cy, outerRadiusX, outerRadiusY }: {cx: number, cy: number, outerRadiusX: number, outerRadiusY: number}) {
    super();
    this.cx = cx;
    this.cy = cy;
    this.outerRadiusX = outerRadiusX;
    this.outerRadiusY = outerRadiusY;
    this.innerRadiusX = outerRadiusX * .4;
    this.innerRadiusY = outerRadiusY * .4;
  }

  transform(transformMatrix: Matrix): Star {
    const transformedMatrix = multiplyMatrix(transformMatrix, this.toMatrix());
    const { cx, cy, outerRadiusX, outerRadiusY } = this.matrixToProps(transformedMatrix);
    return new Star({cx, cy, outerRadiusX, outerRadiusY});
  }

  getBbox(): { x1: number, y1: number, x2: number, y2: number, width: number, height: number } {
    return { 
      x1: this.cx - this.outerRadiusX, 
      y1: this.cy - this.outerRadiusY, 
      x2: this.cx + this.outerRadiusX, 
      y2: this.cy + this.outerRadiusY, 
      width: this.outerRadiusX * 2, 
      height: this.outerRadiusY * 2 
    };
  }

  // For Star class, replace the matrixToProps method with:
  matrixToProps(matrix: Matrix): { cx: number, cy: number, outerRadiusX: number, outerRadiusY: number, innerRadiusX: number, innerRadiusY: number } {
    // Calculate center as average of all x and y coordinates
    const cx = matrix[0].reduce((a, b) => a + b, 0) / matrix[0].length;
    const cy = matrix[1].reduce((a, b) => a + b, 0) / matrix[1].length;
    
    // Calculate outer radii as half the difference between max and min
    const outerRadiusX = (Math.max(...matrix[0]) - Math.min(...matrix[0])) / 2;
    const outerRadiusY = (Math.max(...matrix[1]) - Math.min(...matrix[1])) / 2;
    
    // Inner radius maintains the same ratio as in constructor (0.4)
    const innerRadiusX = outerRadiusX * 0.4;
    const innerRadiusY = outerRadiusY * 0.4;
    
    return { cx, cy, outerRadiusX, outerRadiusY, innerRadiusX, innerRadiusY };
  }

  private createStarPath(cx: number, cy: number, outerRadiusX: number, outerRadiusY: number, innerRadiusX: number, innerRadiusY: number): string {
    let points = [];
    for(let i = 0; i < 10; i++) {
      const radiusX = i % 2 === 0 ? outerRadiusX : innerRadiusX;
      const radiusY = i % 2 === 0 ? outerRadiusY : innerRadiusY;
      const angle = (i * 36 - 90) * Math.PI / 180;
      
      const x = cx + radiusX * Math.cos(angle);
      const y = cy + radiusY * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    
    return `M ${points[0]} L ${points.slice(1).join(' L ')} Z`;
  }

  toSvgStr(fill: string, opacity: number, stroke: string, strokeWidth: number): string {
    const pathData = this.createStarPath(
      this.cx,
      this.cy,
      this.outerRadiusX,
      this.outerRadiusY,
      this.innerRadiusX,
      this.innerRadiusY
    );

    return `<path
      d="${pathData}"
      fill="${fill}"
      opacity="${opacity}"
      stroke="${stroke}"
      strokeWidth="${strokeWidth}"
    />`;
  }
}