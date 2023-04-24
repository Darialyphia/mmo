import { nanoid } from 'nanoid';

type Index<TItem> = {
  key: (el: TItem) => string | number;
  items: Map<any, TItem>;
};
type Group<TItem> = {
  key: (el: TItem) => string;
  items: Map<any, TItem[]>;
};
type Filter<TItem> = {
  predicate: (el: TItem) => boolean;
  items: Set<TItem>;
};

export type IndexedArray<
  TItem,
  TIndex extends string = never,
  TGroup extends string = never
> = {
  size: Readonly<number>;

  getList: () => TItem[];
  getByIndex: (index: TIndex, key: any) => TItem | undefined;
  getByGroup: (group: TGroup, key: any) => TItem[];

  has: (index: TIndex, key: any) => boolean;

  add: (item: TItem) => IndexedArray<TItem, TIndex, TGroup>;

  delete: (item: TItem) => IndexedArray<TItem, TIndex>;
  deleteByIndex: (
    index: TIndex,
    key: any
  ) => IndexedArray<TItem, TIndex, TGroup>;

  addIndex: <T extends string>(
    name: T,
    getKey: (el: TItem) => any
  ) => IndexedArray<TItem, TIndex | T, TGroup>;

  addGroup: <T extends string>(
    name: T,
    getKey: (el: TItem) => any
  ) => IndexedArray<TItem, TIndex, TGroup | T>;

  createFilter: <T = TItem>(predicate: (el: TItem) => boolean) => () => T[];
};

const internalCreateIndexedArray = <
  TItem,
  TIndexes extends { [key: string]: Index<TItem> },
  TGroups extends { [key: string]: Group<TItem> }
>(
  items: TItem[],
  indexes: TIndexes,
  groups: TGroups
): IndexedArray<
  TItem,
  Exclude<keyof TIndexes, number | symbol>,
  Exclude<keyof TGroups, number | symbol>
> => {
  const filters: Record<string, Filter<TItem>> = {};

  const internalAdd = (item: TItem) => {
    Object.values(indexes).forEach(index => {
      index.items.set(index.key(item), item);
    });

    Object.values(groups).forEach(group => {
      const itemKey = group.key(item);
      if (!group.items.has(itemKey)) {
        group.items.set(itemKey, [item]);
        return;
      }
      const g = group.items.get(itemKey)!;
      if (!g.includes(item)) {
        g.push(item);
      }
    });

    Object.values(filters).forEach(filter => {
      if (filter.predicate(item)) {
        filter.items.add(item);
      }
    });
  };

  const internalDelete = (item: TItem) => {
    const listIdx = items.indexOf(item);
    if (listIdx < 0) return;
    items.splice(listIdx, 1);

    Object.values(indexes).forEach(i => {
      for (let [key, value] of i.items.entries()) {
        if (value === item) {
          i.items.delete(key);
        }
      }
    });

    Object.values(groups).forEach(group => {
      for (let [key, value] of group.items.entries()) {
        const idx = value.indexOf(item);
        if (idx >= 0) {
          value.splice(idx, 1);
        }
      }
    });

    Object.values(filters).forEach(filter => {
      filter.items.delete(item);
    });
  };
  items.forEach(internalAdd);

  const ia: IndexedArray<
    TItem,
    Exclude<keyof TIndexes, number | symbol>,
    Exclude<keyof TGroups, number | symbol>
  > = {
    get size() {
      return items.length;
    },

    getList() {
      return items;
    },

    getByIndex(index, key) {
      return indexes[index].items.get(key);
    },

    getByGroup(group, key) {
      return groups[group].items.get(key) ?? [];
    },

    has(index, key) {
      return indexes[index].items.has(key);
    },

    add(item) {
      items.push(item);
      internalAdd(item);

      return ia;
    },

    delete(item) {
      internalDelete(item);

      return ia;
    },

    deleteByIndex(index, key) {
      const item = indexes[index].items.get(key);
      if (!item) return ia;

      internalDelete(item);

      return ia;
    },

    addIndex(name, getKey) {
      const map = new Map<string | number, TItem>();
      items.forEach(item => {
        map.set(getKey(item), item);
      });

      return internalCreateIndexedArray(
        items,
        {
          ...indexes,
          [name]: { key: getKey, items: map }
        },
        groups
      );
    },

    addGroup(name, getKey) {
      const map = new Map<string | number, TItem[]>();

      return internalCreateIndexedArray(items, indexes, {
        ...groups,
        [name]: { key: getKey, items: map }
      });
    },

    createFilter(predicate) {
      const id = nanoid(6);
      const filtered = new Set<TItem>();
      filters[id] = {
        predicate,
        items: filtered
      };

      items.forEach(item => {
        if (predicate(item)) {
          filtered.add(item);
        }
      });

      return () => Array.from(filters[id].items) as any[];
    }
  };

  return ia;
};

export const createIndexedArray = <TItem>(items: TItem[]) =>
  internalCreateIndexedArray<TItem, {}, {}>(items, {}, {});
