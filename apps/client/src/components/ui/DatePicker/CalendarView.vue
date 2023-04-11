<script setup lang="ts">
import { getFocusableChildren, KEYBOARD } from '@/utils/dom';
import { clamp, type Nullable } from '@mmo/shared';
import type { Dayjs } from 'dayjs';

defineOptions({
  name: 'UiDatePickerCalendarView'
});

const props = defineProps<{
  modelValue?: Nullable<Date>;
  minValue?: Nullable<Date>;
  maxValue?: Nullable<Date>;
  position: Dayjs;
  min?: Date;
  max?: Date;
  range?: boolean;
  selectedRange: Dayjs[];
}>();
const emit = defineEmits<{
  (e: 'cell-click', value: Dayjs): void;
}>();

const dayjs = useDayjs();

const daysOfWeek = computed(() => {
  const weekdays = dayjs.localeData().weekdaysMin();
  const start = dayjs.localeData().firstDayOfWeek();

  return weekdays.slice(start).concat(weekdays.slice(0, start));
});

const calendar = computed(() => {
  const DAYS_IN_WEEK = 7;
  const startOfMonth = props.position.startOf('month');
  const days: Dayjs[] = [];

  for (let i = 1; i <= startOfMonth.weekday(); i++) {
    days.unshift(startOfMonth.subtract(i, 'day'));
  }

  days.push(startOfMonth);

  for (let i = 1; i < startOfMonth.daysInMonth(); i++) {
    days.push(startOfMonth.add(i, 'day'));
  }

  const rightPadding = DAYS_IN_WEEK - (days.length % DAYS_IN_WEEK);
  if (rightPadding < DAYS_IN_WEEK) {
    for (let i = 0; i < rightPadding; i++) {
      days.push(startOfMonth.add(startOfMonth.daysInMonth() + i, 'day'));
    }
  }
  return days;
});

const isCellDisabled = (d: Nullable<Dayjs>) => {
  if (!d) return true;
  if (props.min && d.isBefore(dayjs(props.min).startOf('day'))) return true;
  if (props.max && d.isAfter(dayjs(props.max).endOf('day'))) return true;

  return d.month() !== props.position.month();
};

const isCellSelected = (day: Dayjs) => {
  if (isCellDisabled(day)) return false;
  if (props.range) {
    return (
      props.selectedRange.includes(day) ||
      (!props.selectedRange.length &&
        day.isSame(dayjs(props.minValue), 'day')) ||
      (!props.selectedRange.length && day.isSame(dayjs(props.maxValue), 'day'))
    );
  } else {
    return props.modelValue && day.isSame(dayjs(props.modelValue), 'day');
  }
};

const sortedSelectedRange = computed(() =>
  props.selectedRange
    .slice()
    .sort((a: Dayjs, b: Dayjs) => (a.isBefore(b) ? -1 : 1))
);

const isCellInRange = (day: Dayjs) => {
  if (!props.range) return false;
  if (isCellSelected(day)) return false;
  if (isCellDisabled(day)) return false;

  const range = sortedSelectedRange.value;
  if (range.length === 1) return false;
  const min = range[0] || (props.minValue && dayjs(props.minValue));
  const max = range[1] || (props.maxValue && dayjs(props.maxValue));
  if (!min || !max) return false;

  return day.isAfter(min) && day.isBefore(max);
};

const calendarRoot = ref<HTMLElement>();
const activeElement = useActiveElement();

const navigate = (e: KeyboardEvent) => {
  if (
    ![
      KEYBOARD.ArrowDown,
      KEYBOARD.ArrowUp,
      KEYBOARD.ArrowLeft,
      KEYBOARD.ArrowRight
    ].includes(e.code as any)
  ) {
    return;
  }
  if (!activeElement.value) return;
  const focusable = getFocusableChildren(calendarRoot.value);
  if (activeElement.value === calendarRoot.value) {
    return focusable[0]?.focus();
  }
  if (!focusable.includes(activeElement.value)) return;

  e.preventDefault();
  let index = focusable.indexOf(activeElement.value);

  switch (e.code) {
    case KEYBOARD.ArrowDown:
      index += 7;
      break;
    case KEYBOARD.ArrowUp:
      index -= 7;
      break;
    case KEYBOARD.ArrowLeft:
      index -= 1;
      break;
    case KEYBOARD.ArrowRight:
      index += 1;
      break;
  }
  focusable[clamp(index, 0, focusable.length)]?.focus();
};
</script>

<template>
  <!--eslint-disable-next-line vuejs-accessibility/no-static-element-interactions -->
  <div
    ref="calendarRoot"
    class="ui-datepicker-calendar-view"
    tabindex="0"
    @keydown="navigate"
  >
    <div v-for="day in daysOfWeek" :key="day" class="cell">
      {{ day }}
    </div>

    <button
      v-for="(day, dayIndex) in calendar"
      :key="dayIndex"
      class="cell"
      :class="{
        selected: isCellSelected(day),
        range: isCellInRange(day)
      }"
      tabindex="-1"
      :disabled="isCellDisabled(day)"
      @click="emit('cell-click', day)"
    >
      {{ day.format('D') }}
    </button>
  </div>
</template>

<style scoped lang="postcss">
.ui-datepicker-calendar-view {
  display: grid;
  grid-template-columns: repeat(7, 1fr);

  & > div {
    color: var(--text-disabled);
  }
  & .cell {
    padding: 0;
    display: grid;
    place-content: center;
    font-weight: (--font-weight-6);
    background-color: transparent;

    &:disabled {
      color: var(--disabled);
    }
    &:where(button:hover:not(:disabled)) {
      background-color: hsl(var(--primary-light-hsl) / 0.2);
    }
    &:focus {
      position: relative;
      z-index: 1;
    }

    &.selected {
      background-color: var(--primary);
      color: var(--text-on-primary);
    }
    &.range {
      background-color: hsl(var(--primary-light-hsl) / 0.35);
    }
  }
}
</style>
