import type { Point } from '@mmo/shared';

export const createMouseTracker = (canvas: HTMLCanvasElement) => {
  const mousePosition: Point = {
    x: -9999,
    y: -9999
  };

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();

    Object.assign(mousePosition, {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  });

  canvas.addEventListener('mouseleave', () => {
    Object.assign(mousePosition, {
      x: -9999,
      y: -9999
    });
  });

  return mousePosition;
};
