export type Matrix = number[][];

export const multiplyMatrix = (m1: Matrix, m2: Matrix): Matrix => {
  const result = Array(m1.length).fill(0).map(() => Array(m2[0].length).fill(0));
  
  for (let i = 0; i < m1.length; i++) {
    for (let j = 0; j < m2[0].length; j++) {
      for (let k = 0; k < m2.length; k++) {
        result[i][j] += m1[i][k] * m2[k][j];
      }
    }
  }
  return result;
};

export const createTransformMatrix = (sx: number, sy: number, x0: number, y0: number): Matrix => [
  [sx, 0, x0 * (1 - sx)],
  [0, sy, y0 * (1 - sy)],
  [0, 0, 1]
];
