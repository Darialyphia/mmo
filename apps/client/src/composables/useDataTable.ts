import type {
  DataTableColumn,
  DataTableColumnsDefinition
} from '@/types/dataTable';
import {
  isString,
  type AnyObject,
  type Nullable,
  isNumber,
  isObject,
  clamp,
  AggregateResponse
} from '@mmo/shared';
import type { UseVirtualListItem } from '@vueuse/core';
import type { ComputedRef, InjectionKey, Ref, StyleValue, VNodeRef } from 'vue';

export type Column = DataTableColumn & {
  key: string;
  position: number;
  visible: boolean;
  headerElement: Nullable<HTMLElement>;
  headerRef: VNodeRef;
};

export type DataTableContext = {
  tableProps: {
    ref: Ref<Nullable<HTMLElement>>;
    onScroll: () => void;
    style: StyleValue;
  };
  listProps: ComputedRef<AnyObject>;
  list: Ref<UseVirtualListItem<AnyObject>[]>;
  columns: Ref<Column[]>;
  displayedColumns: ComputedRef<Column[]>;
  totalWidth: ComputedRef<string>;
  rowTemplate: ComputedRef<string>;
  resizeColumn: (column: Column, diff: number) => void;
  moveColumn: (column: Column, newIndex: number) => void;
  togglePinColumn: (column: Column) => void;
  search: Ref<string>;
  searchResults: ComputedRef<AnyObject[]>;
  focusPreviousResult: () => void;
  focusNextResult: () => void;
  focusedResultIndex: Ref<Nullable<number>>;
  focusedRow: ComputedRef<Nullable<AnyObject>>;
  data: Ref<AnyObject[]>;
  totalCount: Ref<Nullable<number>>;
  aggregates: Ref<Record<string, Nullable<AggregateResponse>>>;
};

const DATA_TABLE_INJECTION_KEY = Symbol(
  'data-table'
) as InjectionKey<DataTableContext>;

const makeColumns = (columnsDef: DataTableColumnsDefinition) =>
  Object.entries(columnsDef).map(([key, val], index) => {
    const column: Column = {
      ...val,
      position: index,
      visible: !val.isHidden,
      headerElement: null,
      headerRef(el) {
        column.headerElement = unrefElement(el as any);
      },
      key
    };

    return column;
  });

export type UseDataTableOptions = {
  data: Ref<AnyObject[]>;
  aggregates: Ref<Record<string, Nullable<AggregateResponse>>>;
  columnsDef: Ref<DataTableColumnsDefinition>;
  itemHeight: number;
  totalCount: Ref<Nullable<number>>;
  tableEl: Ref<Nullable<HTMLElement>>;
};

export const useDataTableProvider = ({
  data,
  totalCount,
  aggregates,
  columnsDef,
  itemHeight,
  tableEl
}: UseDataTableOptions) => {
  watchEffect(() => {
    if (Object.values(columnsDef.value).every(c => !c.isIdentifier)) {
      console.warn(
        'UiDataTable: the data table has no identifier column. This will hurt accessibility for users using screen readers. Add the `isIdentifier` property to one of the columns.'
      );
    }
  });

  const columns = ref<Column[]>(makeColumns(columnsDef.value));

  const rowTemplate = computed(() => {
    const columnsWidth = displayedColumns.value
      .map(c => c.width)
      .map(width => {
        if (!isDefined(width)) return 'minmax(100px , 1fr)';
        if (isString(width) && /%/.test(width)) return width;

        return `${width}px`;
      })
      .join(' ');

    return `${columnsWidth}`;
  });

  const totalWidth = computed(() => {
    const allColumnsAreFixed = displayedColumns.value.every(col =>
      isNumber(col.width)
    );
    if (!allColumnsAreFixed) return 'auto';
    const scrollbarWidth =
      tableEl.value!.offsetWidth - tableEl.value!.clientWidth;

    return (
      displayedColumns.value.reduce(
        (total, col) => total + (col.width as number),
        0
      ) +
      +scrollbarWidth +
      'px'
    );
  });

  const displayedColumns = computed(() => {
    return columns.value
      .filter(c => c.visible)
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return a.position - b.position;
      });
  });

  const togglePinColumn = (column: Column) => {
    column.isPinned = !column.isPinned;
  };
  const moveColumn = (column: Column, newIndex: number) => {
    const oldIndex = columns.value.indexOf(column);
    if (oldIndex === newIndex) return;
    columns.value.splice(oldIndex, 1);
    columns.value.splice(newIndex, 0, column);
    columns.value.forEach((col, index) => {
      col.position = index;
    });
  };

  const resizeColumn = (column: Column, diff: number) => {
    fixColumnsSize();
    if (!isDefined(column.width) || !isNumber(column.width)) {
      return;
    }

    column.width = clamp(column.width + diff, 100, Infinity);
  };

  const fixColumnsSize = () => {
    columns.value.forEach(col => {
      if (!col.visible) return;
      col.width = col.headerElement!.offsetWidth;
    });
  };

  const { list, containerProps, wrapperProps, scrollTo } = useVirtualList(
    data,
    {
      itemHeight: itemHeight,
      overscan: 10
    }
  );

  const recomputePinnedOffsets = () => {
    let totalOffset = 0;
    const isReady = displayedColumns.value
      .filter(column => column.isPinned)
      .every(c => c.headerElement);
    if (!isReady) return;

    displayedColumns.value
      .filter(column => column.isPinned)
      .forEach(column => {
        const { width } = column.headerElement!.getBoundingClientRect();
        column.pinnedOffset = totalOffset;
        totalOffset += width;
      });
  };
  watchEffect(recomputePinnedOffsets);

  const search = ref('');
  const focusedResultIndex = ref<Nullable<number>>(null);
  watch(search, () => {
    focusedResultIndex.value = null;
  });

  const searchResults = computed(() => {
    return data.value.filter(item => {
      const lookup = (obj: object): boolean => {
        return Object.values(obj).some(val => {
          if (!isDefined(val)) return false;
          if (isObject(val)) return lookup(val);
          if (isNumber(val))
            return val
              .toString()
              .toLowerCase()
              .includes(search.value.toLowerCase());
          if (isString(val))
            return val.toLowerCase().includes(search.value.toLowerCase());

          return false;
        });
      };
      return lookup(item);
    });
  });

  const focusPreviousResult = () => {
    if (!isDefined(focusedResultIndex.value)) {
      focusedResultIndex.value = 0;
      return;
    }
    let newIndex = focusedResultIndex.value - 1;
    if (newIndex < 0) newIndex = searchResults.value.length;
    if (newIndex >= searchResults.value.length) newIndex = 0;
    focusedResultIndex.value = newIndex;
    scrollToFocusedResult();
  };

  const focusedRow = computed(() =>
    focusedResultIndex.value
      ? searchResults.value[focusedResultIndex.value]
      : null
  );

  const focusNextResult = () => {
    if (!isDefined(focusedResultIndex.value)) {
      focusedResultIndex.value = 0;
      return;
    }
    let newIndex = focusedResultIndex.value + 1;
    if (newIndex < 0) newIndex = searchResults.value.length;
    if (newIndex >= searchResults.value.length) newIndex = 0;
    focusedResultIndex.value = newIndex;
    scrollToFocusedResult();
  };

  const scrollToFocusedResult = () => {
    if (!isDefined(focusedResultIndex.value)) return;

    const result = searchResults.value[focusedResultIndex.value];
    if (!isDefined(result)) return;

    const index = data.value.indexOf(result);

    scrollTo(index);
  };

  const api: DataTableContext = {
    tableProps: containerProps,
    listProps: wrapperProps,
    list,
    columns,
    displayedColumns,
    totalWidth,
    rowTemplate,
    resizeColumn,
    moveColumn,
    togglePinColumn,
    search,
    searchResults,
    focusPreviousResult,
    focusNextResult,
    focusedResultIndex,
    focusedRow,
    data,
    aggregates,
    totalCount
  };

  provide(DATA_TABLE_INJECTION_KEY, api);

  return api;
};

export const useDataTable = () => useSafeInject(DATA_TABLE_INJECTION_KEY);
