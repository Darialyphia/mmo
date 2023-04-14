import { AnyObject, Matrix, Nullable } from '@mmo/shared';
import path from 'path';
import Jimp from 'jimp';

type Angle = 0 | 90 | 180 | 270;
type Direction = 'top' | 'bottom' | 'left' | 'right';

type TileMeta = {
  pixels: Matrix<number>;
  angle: Angle;
  index: number;
  key: string;
};

type LayoutMeta = TileMeta[];

type Constraints = {
  top: string[];
  bottom: string[];
  left: string[];
  right: string[];
};

type ConstraintsMap = Map<string, Constraints>;

export const parseLayoutMeta = async (): Promise<LayoutMeta> => {
  const LAYOUTS_PATH = path.join(process.cwd(), 'src/base-layout.png');

  const png = await Jimp.read(LAYOUTS_PATH);
  const width = png.getWidth();
  const height = png.getHeight();

  const chunks: LayoutMeta = [];

  const getPixel = (x: number, y: number) => {
    return png.getPixelColor(x, y);
  };

  const isTransparent = (n: number) => {
    return Jimp.intToRGBA(n).a === 0;
  };

  const CHUNK_SIZE = 3;

  for (let y = 0; y < height; y += CHUNK_SIZE) {
    for (let x = 0; x < width; x += CHUNK_SIZE) {
      const pixels: Matrix<number> = [
        // prettier-ignore
        [getPixel(x, y),     getPixel(x + 1, y),     getPixel(x + 2, y)],
        [getPixel(x, y + 1), getPixel(x + 1, y + 1), getPixel(x + 2, y + 1)],
        [getPixel(x, y + 2), getPixel(x + 1, y + 2), getPixel(x + 2, y + 2)]
      ];

      const isEmpty = pixels.flat().every(isTransparent);
      if (isEmpty) continue;

      const angle = ((x / CHUNK_SIZE) * 90) as Angle;
      const index = y / CHUNK_SIZE;

      chunks.push({
        pixels,
        angle,
        index,
        key: `${index}:${angle}`
      });
    }
  }

  return chunks;
};

export const createMapRules = (layout: LayoutMeta): WFCRule[] => {
  const map: ConstraintsMap = new Map();

  const getConstraints = (tile: TileMeta, direction: Direction) => {
    return layout
      .filter(otherTile => {
        let pixels: number[], otherPixels: number[];

        switch (direction) {
          case 'top':
            pixels = [tile.pixels[0][0], tile.pixels[0][1], tile.pixels[0][2]];
            //prettier-ignore
            otherPixels = [ otherTile.pixels[2][0], otherTile.pixels[2][1], otherTile.pixels[2][2]];
            break;
          case 'bottom':
            pixels = [tile.pixels[2][0], tile.pixels[2][1], tile.pixels[2][2]];
            //prettier-ignore
            otherPixels = [ otherTile.pixels[0][0], otherTile.pixels[0][1], otherTile.pixels[0][2]];
            break;
          case 'left':
            pixels = [tile.pixels[0][0], tile.pixels[1][0], tile.pixels[2][0]];
            //prettier-ignore
            otherPixels = [ otherTile.pixels[0][2], otherTile.pixels[1][2], otherTile.pixels[2][2]];
            break;
          case 'right':
            pixels = [tile.pixels[0][2], tile.pixels[1][2], tile.pixels[2][2]];
            //prettier-ignore
            otherPixels = [ otherTile.pixels[0][0], otherTile.pixels[1][0], otherTile.pixels[2][0]];
            break;
        }

        return otherPixels.every((pixel, index) => pixels[index] === pixel);
      })
      .map(tile => `${tile.index}:${tile.angle}`);
  };

  layout.forEach(tileMeta => {
    map.set(tileMeta.key, {
      top: getConstraints(tileMeta, 'top'),
      bottom: getConstraints(tileMeta, 'bottom'),
      left: getConstraints(tileMeta, 'left'),
      right: getConstraints(tileMeta, 'right')
    });
  });

  const keys = layout.map(tile => tile.key);

  return [...map.entries()]
    .map(([tile, { top, bottom, left, right }]) => [
      ...top.map(
        neighbor => ['y', keys.indexOf(neighbor), keys.indexOf(tile)] as WFCRule
      ),
      ...bottom.map(
        neighbor => ['y', keys.indexOf(tile), keys.indexOf(neighbor)] as WFCRule
      ),
      ...left.map(
        neighbor => ['x', keys.indexOf(neighbor), keys.indexOf(tile)] as WFCRule
      ),
      ...right.map(
        neighbor => ['x', keys.indexOf(tile), keys.indexOf(neighbor)] as WFCRule
      )
    ])
    .flat();
};

export const WFCTool2D = function () {
  const tiles: Matrix<string>[] = [];
  const weights: number[] = [];
  let n_prototypes = 0;
  const formulae: [number, string, Matrix<string>][] = [];

  const transformBank = {
    cw: function (m: Matrix<string>) {
      const r: Matrix<string> = [];
      for (let i = 0; i < m.length; i++) {
        r.push([]);
        for (let j = m.length - 1; j >= 0; j--) {
          r.at(-1)?.push(m[j][i]);
        }
      }
      return r;
    },

    fx: function (m: Matrix<string>) {
      const r: Matrix<string> = [];
      for (let i = 0; i < m.length; i++) {
        r.push([]);
        for (let j = m[0].length - 1; j >= 0; j--) {
          r.at(-1)?.push(m[i][j]);
        }
      }
      return r;
    },
    fy: function (m: Matrix<string>) {
      const r: Matrix<string> = [];
      for (let i = m.length - 1; i >= 0; i--) {
        r.push([]);
        for (let j = 0; j < m[i].length; j++) {
          r.at(-1)?.push(m[i][j]);
        }
      }
      return r;
    }
  };

  function equal(m: Matrix<any>, r: Matrix<any>) {
    for (let i = 0; i < m.length; i++) {
      for (let j = 0; j < m[0].length; j++) {
        if (m[i][j] != r[i][j]) {
          return false;
        }
      }
    }
    return true;
  }

  function fit(d: string, a: Matrix<any>, b: Matrix<any>) {
    if (d == 'x') {
      for (let i = 0; i < a.length; i++) {
        if (a[i][a[i].length - 1] != b[i][0]) {
          return false;
        }
      }
    } else if (d == 'y') {
      for (let i = 0; i < a[0].length; i++) {
        if (a[a.length - 1][i] != b[0][i]) {
          return false;
        }
      }
    }
    return true;
  }

  const addTile = function (
    s: string,
    { transforms = ['cw', 'cw+cw', 'cw+cw+cw'], weight = 1 } = {}
  ) {
    const t = s.split('\n').map(x => x.split(''));
    tiles.push(t);
    formulae.push([n_prototypes, '', t]);
    weights.push(weight);

    const tests = [];

    for (let i = 0; i < transforms.length; i++) {
      const tl = transforms[i].split('+') as (keyof typeof transformBank)[];
      let tt = t;
      for (let j = 0; j < tl.length; j++) {
        tt = transformBank[tl[j]](tt);
      }
      tests.push(tt);
    }
    for (let i = 0; i < tests.length; i++) {
      let ok = true;
      for (let j = 0; j < tiles.length; j++) {
        if (equal(tests[i], tiles[j])) {
          ok = false;
          break;
        }
      }
      if (ok) {
        tiles.push(tests[i]);
        weights.push(weight);
        formulae.push([n_prototypes, transforms[i], tests[i]]);
      }
    }
    n_prototypes++;
  };

  const getTileFormulae = function () {
    return formulae;
  };

  const generateWFCInput = function () {
    const rules: [string, number, number][] = [];
    for (let i = 0; i < tiles.length; i++) {
      for (let j = 0; j < tiles.length; j++) {
        if (fit('x', tiles[i], tiles[j])) {
          rules.push(['x', i, j]);
        }
        if (fit('y', tiles[i], tiles[j])) {
          rules.push(['y', i, j]);
        }
      }
    }
    return { weights, rules, nd: 2 };
  };

  return {
    addTile,
    getTileFormulae,
    generateWFCInput
  };
};

export type WFCRule = [string, number, number];
type WFCOptions = { nd: number; weights: number[]; rules: WFCRule[] };
export const WFC = function ({ nd, weights, rules }: WFCOptions) {
  let wave: AnyObject = {};
  let wavefront: Record<string, number[]> = {};
  const patternsCount = weights.length;

  function coord(k: string) {
    return k.split(',').map(x => parseInt(x));
  }

  function entropy(x: AnyObject) {
    let one = 0;
    for (let i = 0; i < x.length; i++) {
      one += x[i] * weights[i];
    }
    let S = 0;
    for (let i = 0; i < x.length; i++) {
      const pi = (x[i] * weights[i]) / one;
      if (pi != 0) {
        S -= pi * Math.log(pi);
      }
    }
    return S;
  }

  function collapse(x: AnyObject) {
    let one = 0;
    for (let i = 0; i < x.length; i++) {
      one += x[i] * weights[i];
    }
    let r = Math.random() * one;
    for (let i = 0; i < x.length; i++) {
      r -= x[i] * weights[i];
      if (r < 0) {
        const y: number[] = new Array(x.length).fill(0);
        y[i] = 1;
        return y;
      }
    }
  }

  function neighborable(d: any[], a: any, b: any) {
    let didx = d.indexOf(1);
    if (didx < 0) {
      didx = d.indexOf(-1);
      [a, b] = [b, a];
    }
    for (let i = 0; i < rules.length; i++) {
      // @ts-ignore math nerd shit
      if (didx == rules[i][0] || 'yxz'[didx] == rules[i][0]) {
        if (a == rules[i][1] && b == rules[i][2]) {
          return true;
        }
      }
    }
    return false;
  }

  function propagate(p: number[]) {
    const stack = [p];

    while (stack.length) {
      p = stack.pop()!;

      const dirs: number[][] = [];
      for (let i = 0; i < nd; i++) {
        const d0: number[] = new Array(nd).fill(0);
        d0[i] = -1;
        dirs.push(d0);

        const d1: number[] = new Array(nd).fill(0);
        d1[i] = 1;
        dirs.push(d1);
      }
      for (let i = 0; i < dirs.length; i++) {
        const q = [];
        for (let j = 0; j < p.length; j++) {
          q.push(p[j] + dirs[i][j]);
        }
        // @ts-ignore math nerds mfers go to gulag
        let x = wavefront[p];
        if (x == undefined) {
          // @ts-ignore math nerds mfers go to gulag
          x = wave[p];
        }
        // @ts-ignore math nerds mfers go to gulag
        const y = wavefront[q];
        if (x == undefined) {
          // @ts-ignore math nerds mfers go to gulag
          x = wave[q];
        }

        if (typeof y == 'number' || typeof y == 'undefined') {
          continue;
        } else if (typeof x == 'number' && typeof y == 'object') {
          let mod = false;
          for (let j = 0; j < y.length; j++) {
            if (y[j] == 0) {
              continue;
            }
            if (y[j] > 0 && !neighborable(dirs[i], x, j)) {
              y[j] = 0;
              mod = true;
            }
          }
          if (mod) {
            stack.push(q);
          }
        } else if (typeof x == 'object' && typeof y == 'object') {
          let mod = false;
          for (let j = 0; j < y.length; j++) {
            if (y[j] == 0) {
              continue;
            }
            let ok = false;
            for (let k = 0; k < x.length; k++) {
              if (x[k] > 0 && y[j] > 0 && neighborable(dirs[i], k, j)) {
                ok = true;
                break;
              }
            }
            if (!ok) {
              y[j] = 0;
              mod = true;
            }
          }
          if (mod) {
            stack.push(q);
          }
        } else {
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          throw Error(`Invalid propagation parameter: ${x}, ${y}`);
        }
      }
    }
  }

  function argmax(vals: number[]) {
    let mi = -1;
    let mv = -Infinity;
    for (let i = 0; i < vals.length; i++) {
      if (vals[i] > mv) {
        mv = vals[i];
        mi = i;
      }
    }
    return mi;
  }

  const readout = function (collapse = true) {
    console.log('wave', wave);
    console.log('wavefront', wavefront);
    if (!collapse) {
      const result: AnyObject = {};
      for (const k in wave) {
        const oh: number[] = Array(patternsCount).fill(0);
        oh[wave[k]] = 1;
        result[k] = oh;
      }
      for (const k in wavefront) {
        const s = wavefront[k].reduce((a, b) => a + b, 0);
        const oh = wavefront[k].map(x => (s == 0 ? 0 : x / s));
        // @ts-ignore math nerds mfers go to gulag
        result[k] = oh;
      }
      return result as Record<string, number>;
    }

    const result = {};
    for (const k in wavefront) {
      if (wavefront[k].reduce((a, b) => a + b, 0) == 1) {
        // @ts-ignore math nerds mfers go to gulag
        result[k] = argmax(wavefront[k]);
      }
    }
    return Object.assign({}, wave, result) as Record<string, number>;
  };

  const expand = function (xmin: number[], xmax: number[]) {
    let coords = [[0]];
    for (let i = 0; i < xmin.length; i++) {
      let cc: number[][] = [];
      for (let x = xmin[i]; x < xmax[i]; x++) {
        const c = [];
        for (let j = 0; j < coords.length; j++) {
          c.push(coords[j].concat(x));
        }
        cc = cc.concat(c);
      }
      coords = cc;
    }
    coords = coords
      .map(x => x.slice(1))
      .filter(x => !(x.toString() in wave || x.toString() in wavefront));

    coords.map(
      x =>
        (wavefront[x.toString()] = new Array(patternsCount).fill(1) as number[])
    );
    for (const k in wave) {
      propagate(coord(k));
    }
  };

  const step = function () {
    return new Promise<boolean>(resolve => {
      setTimeout(() => {
        let min_ent = Infinity;
        let min_arg: number[] = [];
        for (const k in wavefront) {
          let ent = entropy(wavefront[k]);
          if (isNaN(ent)) {
            console.log('unsolvable, need to recompute');
            for (const k in wavefront) {
              wavefront[k] = new Array(patternsCount).fill(1);
            }
            for (const k in wave) {
              propagate(coord(k));
            }

            resolve(false);
          }
          if (ent == 0) {
            continue;
          }
          ent += Math.random() - 0.5;
          if (ent < min_ent) {
            min_ent = ent;
            min_arg = coord(k);
          }
        }

        if (min_ent == Infinity) {
          wave = readout();
          wavefront = {};
          return resolve(true);
        }

        const key = min_arg.toString();
        wavefront[key] = collapse(wavefront[key])!;
        propagate(min_arg);
        return resolve(false);
      });
    });
  };

  return { readout, step, expand };
};
