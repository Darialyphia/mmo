import { Application, Container, Graphics } from 'pixi.js';
import { Camera } from './createCamera';
import { GameMeta } from '@mmo/shared';
import { GameState } from '.';
import { getCellKey } from './utils/map';

export type CreateMiniMapOptions = {
  app: Application;
  meta: GameMeta;
};

const MINIMAP_SIZE = Math.min(300, window.innerWidth / 4);

// x axis is height, Y axis is temperature
const COLORS = [
  [0x6666ff, 0x22aabb, 0xffffff],
  [0x6666ff, 0xffff00, 0x55bb55],
  [0x6666ff, 0xffff00, 0xff8800]
];
export const createMiniMap = ({ app, meta }: CreateMiniMapOptions) => {
  const container = new Graphics();
  container.zIndex = 2;
  container.lineStyle({ width: 1, color: 0xffffff });
  container.drawRect(0, 0, meta.width, meta.height);

  const miniMap = new Graphics();
  miniMap.clear();
  miniMap.beginFill(0x0000);
  miniMap.drawRect(0, 0, meta.width, meta.height);

  const scale = (1 * MINIMAP_SIZE) / meta.width;
  container.addChild(miniMap);
  container.position.set(app.screen.width - MINIMAP_SIZE, 0);
  container.scale.set(scale, scale);
  app.stage.addChild(container);

  const entitiesG = new Graphics();
  entitiesG.zIndex = 2;
  container.addChild(entitiesG);

  const drawnCells = new Set<string>();
  return {
    onStateUpdate: (snapshot: GameState) => {
      snapshot.fieldOfView.forEach(cell => {
        if (drawnCells.has(getCellKey(cell.position))) return;

        miniMap.beginFill(COLORS[cell.temperature]?.[cell.height] as number);
        miniMap.drawRect(cell.position.x, cell.position.y, 1, 1);
        drawnCells.add(getCellKey(cell.position));
      });

      entitiesG.clear();
      snapshot.entities.forEach(entity => {
        entitiesG.beginFill(entity.id === meta.sessionId ? 0x0000ff : 0xff0000);
        entitiesG.drawCircle(entity.position.x, entity.position.y, 1);
      });
    }
  };
};
