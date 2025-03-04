export type Dimensions = {
  w: number;
  h: number;
}

export type Position = {
  x: number;
  y: number;
}

export type Scale = {
  x: number;
  y: number;
}

export enum Handle {
  TOP_LEFT = 'TOP_LEFT',
  TOP_RIGHT = 'TOP_RIGHT',
  BOTTOM_LEFT = 'BOTTOM_LEFT',
  BOTTOM_RIGHT = 'BOTTOM_RIGHT',
  TOP = "TOP",
  BOTTOM = "BOTTOM",
  LEFT = "LEFT",
  RIGHT = "RIGHT"
}