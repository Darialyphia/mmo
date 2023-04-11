export type Point = { x: number; y: number };
export type Size = { w: number; h: number };
export type Circle = Point & { r: number };
export type Rectangle = Point & Size;
