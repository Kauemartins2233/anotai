import { Vertex } from '../types/api';

export function pixelToNormalized(
  px: number,
  py: number,
  imgWidth: number,
  imgHeight: number
): Vertex {
  return {
    x: px / imgWidth,
    y: py / imgHeight,
  };
}

export function normalizedToPixel(
  nx: number,
  ny: number,
  imgWidth: number,
  imgHeight: number
): { x: number; y: number } {
  return {
    x: nx * imgWidth,
    y: ny * imgHeight,
  };
}

export function verticestoPixelArray(
  vertices: Vertex[],
  imgWidth: number,
  imgHeight: number
): number[] {
  const points: number[] = [];
  for (const v of vertices) {
    const p = normalizedToPixel(v.x, v.y, imgWidth, imgHeight);
    points.push(p.x, p.y);
  }
  return points;
}
