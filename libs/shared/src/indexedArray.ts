type Index<T> = {
  key: (el: T) => string | number;
  map: Map<any, T>;
};
type Group<T> = {
  key: (el: T) => string;
  map: Map<any, T[]>;
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

  add: (item: TItem) => IndexedArray<TItem, TIndex>;

  delete: (item: TItem) => IndexedArray<TItem, TIndex>;
  deleteByIndex: (index: TIndex, key: any) => IndexedArray<TItem, TIndex>;

  addIndex: <T extends string>(
    name: T,
    getKey: (el: TItem) => any
  ) => IndexedArray<TItem, TIndex | T>;

  addGroup: <T extends string>(
    name: T,
    getKey: (el: TItem) => any
  ) => IndexedArray<TItem, TIndex, TGroup | T>;
};

export const createIndexedArray = <
  T,
  TIndexes extends { [key: string]: Index<T> },
  TGroups extends { [key: string]: Group<T> }
>(
  items: T[],
  indexes: TIndexes,
  groups: TGroups
): IndexedArray<
  T,
  Exclude<keyof TIndexes, number | symbol>,
  Exclude<keyof TGroups, number | symbol>
> => {
  const _indexes: TIndexes = indexes ?? {};
  const _groups: TGroups = groups ?? {};

  const addToIndexesAndGroups = (item: T) => {
    Object.values(_indexes).forEach(index => {
      index.map.set(index.key(item), item);
    });

    Object.values(_groups).forEach(group => {
      const itemKey = group.key(item);
      if (!group.map.has(itemKey)) {
        group.map.set(itemKey, []);
      }
      const g = group.map.get(itemKey)!;
      if (!g.includes(item)) {
        g.push(item);
      }
    });
  };

  const removeFromIndexesAndgroups = (item: T) => {
    const listIdx = items.indexOf(item);
    if (listIdx < 0) return;
    items.splice(listIdx, 1);

    Object.values(_indexes).forEach(i => {
      for (let [key, value] of i.map.entries()) {
        if (value === item) {
          i.map.delete(key);
        }
      }
    });

    Object.values(_groups).forEach(group => {
      for (let [key, value] of group.map.entries()) {
        const idx = value.indexOf(item);
        if (idx >= 0) {
          value.splice(idx, 1);
        }
      }
    });
  };
  items.forEach(addToIndexesAndGroups);

  const ia: IndexedArray<
    T,
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
      return _indexes[index].map.get(key);
    },

    getByGroup(group, key) {
      return _groups[group].map.get(key) ?? [];
    },

    has(index, key) {
      return _indexes[index].map.has(key);
    },

    add(item) {
      items.push(item);
      addToIndexesAndGroups(item);

      return ia;
    },

    delete(item) {
      removeFromIndexesAndgroups(item);

      return ia;
    },

    deleteByIndex(index, key) {
      const item = _indexes[index].map.get(key);
      if (!item) return ia;

      removeFromIndexesAndgroups(item);

      return ia;
    },

    addIndex(name, getKey) {
      const map = new Map<string | number, T>();
      items.forEach(item => {
        map.set(getKey(item), item);
      });

      return createIndexedArray(
        items,
        {
          ..._indexes,
          [name]: { key: getKey, map }
        },
        _groups
      );
    },

    addGroup(name, getKey) {
      const map = new Map<string | number, T[]>();

      return createIndexedArray(items, _indexes, {
        ..._groups,
        [name]: { key: getKey, map }
      });
    }
  };

  return ia;
};
