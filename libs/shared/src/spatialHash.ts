import { sat } from './math';
import { pointCircleCollision, rectRectCollision } from './collisions';
import { createMatrix } from './helpers';
import type { Rectangle, Point, Boundaries, Nullable, Size } from './types';

export type GridItem = Rectangle & {
  cellsIndices: Point[];
  boundaries: Boundaries<Point>;
  queryId: Nullable<number>;
};

export type GridNode = {
  items: GridItem[];
};

export type SpatialHashGridOptions = {
  dimensions: Size;
  bounds: { start: Point; end: Point };
};

export type SpatialHashGrid = ReturnType<typeof createSpatialHashGrid>;

export const createSpatialHashGrid = ({
  dimensions,
  bounds
}: SpatialHashGridOptions) => {
  const { start: startBound, end: endBound } = bounds;
  const cells = createMatrix<Nullable<GridNode>>(dimensions, () => ({
    items: []
  }));
  let currentQueryId = 0;

  const getCellIndex = (position: Point): Point => {
    const xPos = sat((position.x - startBound.x) / (endBound.x - startBound.x));
    const yPos = sat((position.y - startBound.y) / (endBound.y - startBound.y));

    return {
      x: Math.floor(xPos * dimensions.w),
      y: Math.floor(yPos * dimensions.h)
    };
  };

  const getBoundaries = ({ x, y, w, h }: Rectangle): Boundaries<Point> => {
    return {
      min: getCellIndex({
        x: x - w / 2,
        y: y - h / 2
      }),
      max: getCellIndex({
        x: x + dimensions.w / 2,
        y: y + dimensions.h / 2
      })
    };
  };

  const insert = (item: GridItem) => {
    const { min, max } = item.boundaries;
    const itemCells: Point[] = [];
    for (let x = min.x; x <= max.x; ++x) {
      for (let y = min.y; y <= max.y; ++y) {
        itemCells.push({ x, y });
        cells[x]?.[y]?.items.push(item);
      }
    }

    item.cellsIndices = itemCells;
  };

  const add = (rect: Rectangle) => {
    const item: GridItem = {
      ...rect,
      cellsIndices: [],
      boundaries: getBoundaries(rect),
      queryId: null
    };

    insert(item);

    return item;
  };

  const remove = (item: GridItem) => {
    item.cellsIndices.forEach(({ x, y }) => {
      const cell = cells[x]?.[y];
      if (!cell) return;

      const { items } = cell;
      items.splice(items.indexOf(item), 1);
    });
  };

  const update = (item: GridItem) => {
    const { min, max } = getBoundaries(item);

    const hasChangedCell =
      item.boundaries.min.x !== min.x ||
      item.boundaries.min.y !== min.y ||
      item.boundaries.max.x !== max.x ||
      item.boundaries.max.y !== max.y;

    if (!hasChangedCell) return;
    item.boundaries = { min, max };
    remove(item);
    insert(item);
  };

  const findNearby = (position: Point, bounds: Size) => {
    const { min, max } = getBoundaries({ ...position, ...bounds });
    const nearby: GridItem[] = [];
    currentQueryId++;

    for (let x = min.x; x <= max.x; ++x) {
      for (let y = min.y; y <= max.y; ++y) {
        const cell = cells[x]?.[y];
        if (!cell) continue;

        cell.items.forEach(item => {
          const isWithinBounds = rectRectCollision(
            {
              x: item.x - item.w / 2,
              y: item.y - item.h / 2,
              w: item.w,
              h: item.h
            },
            {
              x: position.x - bounds.w / 2,
              y: position.y - bounds.h / 2,
              ...bounds
            }
          );
          if (!isWithinBounds) return;
          if (item.queryId === currentQueryId) return;

          item.queryId = currentQueryId;
          nearby.push(item);
        });
      }
    }
    return nearby;
  };

  const findNearbyRadius = (position: Point, radius: number) => {
    const { min, max } = getBoundaries({
      ...position,
      w: radius * 2,
      h: radius * 2
    });
    const nearby: GridItem[] = [];
    currentQueryId++;

    for (let x = min.x; x <= max.x; ++x) {
      for (let y = min.y; y <= max.y; ++y) {
        const cell = cells[x]?.[y];
        if (!cell) continue;

        cell.items.forEach(item => {
          const isWithinBounds = pointCircleCollision(
            { x: item.x, y: item.y },
            {
              ...position,
              r: radius
            }
          );
          if (!isWithinBounds) return;
          if (item.queryId === currentQueryId) return;

          item.queryId = currentQueryId;
          nearby.push(item);
        });
      }
    }
    return nearby;
  };

  return {
    dimensions,
    add,
    remove,
    update,
    findNearby,
    findNearbyRadius,
    getCellIndex
  };
};
