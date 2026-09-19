export type AnnotationTool = "rect" | "arrow";

export interface RectShape {
  tool: "rect";
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  style: "outline" | "highlight";
}

export interface ArrowShape {
  tool: "arrow";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

export type AnnotationShape = RectShape | ArrowShape;
