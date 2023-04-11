import type { InjectionKey, Ref } from 'vue';
import {
  FILTER_OPERATORS,
  type FilterOperator,
  type AnyObject,
  type Nullable,
  isDefined
} from '@mmo/shared';

export type DataFilterType = 'string' | 'number' | 'date' | 'boolean' | 'enum';

type BooleanFilterOperator = Extract<FilterOperator, 'equals'>;
type StringFilterOperator = Extract<
  FilterOperator,
  'equals' | 'contains' | 'startsWith' | 'endsWith'
>;
type NumberFilterOperator = Extract<
  FilterOperator,
  'equals' | 'lt' | 'loe' | 'gt' | 'goe'
>;
type DateFilterOperator = Extract<
  FilterOperator,
  'date_equals' | 'boe' | 'before' | 'aoe' | 'after' | 'date_between'
>;
type EnumFilterOperator = Extract<FilterOperator, 'in'>;

export type DataFilterOperator =
  | StringFilterOperator
  | NumberFilterOperator
  | DateFilterOperator
  | BooleanFilterOperator
  | EnumFilterOperator;

export type StringFilter = {
  operator: StringFilterOperator;
  value: Nullable<string>;
};
export type NumberFilter = {
  operator: NumberFilterOperator;
  value: Nullable<number | [number, number]>;
};
export type DateFilter = {
  operator: DateFilterOperator;
  value: Nullable<Date | [Date, Date]>;
};
export type BooleanFilter = {
  operator: BooleanFilterOperator;
  value: boolean;
};
export type EnumFilter = {
  operator: EnumFilterOperator;
  value: string[];
};
export type DataFilterValue =
  | StringFilter
  | NumberFilter
  | DateFilter
  | BooleanFilter
  | EnumFilter;

type DataFilterValues =
  | { type: 'string'; value: Ref<StringFilter[]> }
  | { type: 'number'; value: Ref<NumberFilter[]> }
  | { type: 'date'; value: Ref<DateFilter[]> }
  | { type: 'boolean'; value: Ref<BooleanFilter[]> }
  | { type: 'enum'; value: Ref<EnumFilter[]> };

type DataFilterOptions =
  | { type: 'string'; label: string }
  | { type: 'number'; label: string }
  | { type: 'date'; label: string; datetime: boolean }
  | { type: 'enum'; label: string; choices: { label: string; value: any }[] }
  | { type: 'boolean'; label: string };

type DataFilter = DataFilterValues & DataFilterOptions;

type DataFilterContext = {
  filters: Record<string, DataFilter>;
  format(filter: DataFilterValue, type: DataFilterType): string;
  addFilter(name: string): DataFilterValue;
  removeFilter(name: string, index: number): void;
  toQueryObject(): AnyObject;
};

export const DATA_FILTER_INJECTION_KEY = Symbol(
  'data filter'
) as InjectionKey<DataFilterContext>;

export type UseDataFilterOptions = Record<string, DataFilterOptions>;

export const useDataFilterProvider = (defs: UseDataFilterOptions) => {
  const filters = Object.fromEntries(
    Object.entries(defs).map(([key, def]) => {
      return [
        key,
        {
          ...def,
          value: ref([])
        } as DataFilter
      ];
    })
  );

  const { t } = useI18n();
  const dayjs = useDayjs();

  const serializeValue = (val: unknown): unknown => {
    if (val instanceof Date) return val.getTime();
    if (Array.isArray(val)) return val.map(serializeValue);

    return val;
  };

  const api: DataFilterContext = {
    filters,
    format(filter, type) {
      const formatIfDate = (val: any, dateformat = 'L') =>
        type === 'date' && isDefined(val) ? dayjs(val).format(dateformat) : val;

      return t(`dataFilter.${type}.format.${filter.operator}`, {
        value: formatIfDate(filter.value),
        valueMin: Array.isArray(filter.value) && formatIfDate(filter.value[0]),
        valueMax: Array.isArray(filter.value) && formatIfDate(filter.value[1])
      });
    },
    addFilter(name: string) {
      const filter = filters[name];
      if (!filter) throw new Error(`Unknown filter: ${name}`);

      let newFilter: DataFilterValue;
      switch (filter?.type) {
        case 'string':
          newFilter = { operator: FILTER_OPERATORS.EQUALS, value: undefined };
          break;
        case 'number':
          newFilter = { operator: FILTER_OPERATORS.EQUALS, value: undefined };
          break;
        case 'boolean':
          newFilter = { operator: FILTER_OPERATORS.EQUALS, value: undefined };
          break;
        case 'date':
          // prettier-ignore
          newFilter = { operator: FILTER_OPERATORS.DATE_EQUALS, value: undefined };
          break;
        case 'enum':
          newFilter = { operator: FILTER_OPERATORS.IN, value: [] };
          break;
      }

      filter.value.value.push(newFilter as any);

      return newFilter;
    },
    removeFilter(name, index) {
      filters[name]?.value.value.splice(index, 1);
    },
    toQueryObject() {
      return Object.fromEntries(
        Object.entries(filters)
          .map(([columnName, columnFilters]) => {
            const items = unref(
              columnFilters.value as unknown as DataFilterValue[]
            );

            return [
              columnName,
              items
                .filter(filter => isDefined(filter.value))
                .map(filter => {
                  if (filter.operator === 'date_equals') {
                    const d = dayjs(filter.value as Date);
                    return [
                      filter.operator,
                      serializeValue([
                        new Date(d.startOf('date').valueOf()),
                        new Date(d.endOf('date').valueOf())
                      ])
                    ];
                  }
                  if (filter.operator === 'date_between') {
                    const start = dayjs((filter.value as any)[0] as Date);
                    const end = dayjs((filter.value as any)[1] as Date);
                    return [
                      filter.operator,
                      serializeValue([
                        new Date(start.startOf('date').valueOf()),
                        new Date(end.endOf('date').valueOf())
                      ])
                    ];
                  }
                  return [filter.operator, serializeValue(filter.value)];
                })
            ];
          })
          .filter(([, rules]) => rules?.length)
      );
    }
  };
  provide(DATA_FILTER_INJECTION_KEY, api);

  return api;
};

export const useDataFilter = () => useSafeInject(DATA_FILTER_INJECTION_KEY);

export const useDataFilterEditor = () => {
  const { addFilter } = useDataFilter();

  const drafts = ref(new Map<DataFilterValue, DataFilterValue>());
  const addFilterAndDraft = (name: string) => {
    const filter = addFilter(name);
    drafts.value.set(filter, { ...filter });
  };

  const isEditing = (filter: DataFilterValue) => {
    return drafts.value.has(filter);
  };
  const isDraftValid = (filter: DataFilterValue) => {
    const draft = drafts.value.get(filter);
    if (!draft) return false;

    return isDefined(draft.operator) && isDefined(draft.value);
  };

  const commitDraft = (filter: DataFilterValue) => {
    const draft = drafts.value.get(filter);
    if (!draft) return;
    Object.assign(filter, draft);
    drafts.value.delete(filter);
  };

  const createDraft = (filter: DataFilterValue) => {
    drafts.value.set(filter, { ...filter });
  };

  const removeDraft = (filter: DataFilterValue) => {
    drafts.value.delete(filter);
  };

  return {
    drafts,
    addFilterAndDraft,
    isEditing,
    isDraftValid,
    commitDraft,
    createDraft,
    removeDraft
  };
};
