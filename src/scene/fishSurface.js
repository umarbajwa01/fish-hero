import { skinPoint, NOSE_U } from "./swimRig.js";
export { NOSE_U };
export const COLUMNS = 64;
export const ROWS = 16;

export function fishSize(width, height, imageAspect) {
  const length = Math.min(780, width < 700 ? width * 0.92 : width * 0.55, height * 0.95);
  return { length, height: length / imageAspect };
}

export function makeSurface(columns = COLUMNS, rows = ROWS) {
  const positions = new Float32Array((columns + 1) * (rows + 1) * 3);
  const uvs = new Float32Array((columns + 1) * (rows + 1) * 2);
  const indices = [];
  for (let row = 0; row <= rows; row++) {
    for (let col = 0; col <= columns; col++) {
      const index = row * (columns + 1) + col;
      uvs[index * 2] = col / columns;
      uvs[index * 2 + 1] = 1 - row / rows;
    }
  }
  // Tail first, head last: the body stays in front on tight, overlapping turns.
  for (let col = 0; col < columns; col++) {
    for (let row = 0; row < rows; row++) {
      const index = row * (columns + 1) + col;
      const next = index + columns + 1;
      indices.push(index, index + 1, next, index + 1, next + 1, next);
    }
  }
  return { positions, uvs, indices, columns, rows };
}

export function deformSurface(surface, rig) {
  for (let row = 0; row <= surface.rows; row++) {
    for (let col = 0; col <= surface.columns; col++) {
      const point = skinPoint(rig, col / surface.columns, row / surface.rows);
      const i = (row * (surface.columns + 1) + col) * 3;
      surface.positions[i] = point.x;
      surface.positions[i + 1] = point.y;
      surface.positions[i + 2] = 0;
    }
  }
}

export function skeletonPaths(rig) {
  const paths = [];
  const point = (u, v) => skinPoint(rig, u, v);
  const spine = [];
  for (let i = 0; i <= 40; i++) spine.push(point(0.12 + i / 40 * 0.83, 0.5));
  paths.push(spine);
  for (let i = 0; i < 20; i++) {
    const u = 0.32 + i / 20 * 0.55;
    const width = Math.sin((u - 0.22) / 0.72 * Math.PI) * 0.12;
    paths.push([point(u - 0.018, 0.5 - width), point(u + 0.015, 0.5), point(u - 0.018, 0.5 + width)]);
  }
  for (const side of [-1, 1]) {
    for (let i = 0; i <= 10; i++) {
      paths.push([point(0.34, 0.5), point(0.06 + i * 0.014, 0.5 + side * (0.06 + i * 0.025))]);
      paths.push([point(0.83, 0.5 + side * 0.10), point(0.65 + i * 0.015, 0.5 + side * (0.20 + i * 0.025))]);
    }
  }
  const head = [];
  for (let i = 0; i <= 24; i++) {
    const a = i / 24 * Math.PI * 2;
    head.push(point(0.90 + Math.cos(a) * 0.06, 0.5 + Math.sin(a) * 0.10));
  }
  paths.push(head);
  return paths;
}
