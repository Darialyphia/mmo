<script setup lang="ts">
import type { Nullable } from '@mmo/shared';
import type { Dayjs } from 'dayjs';

defineOptions({
  name: 'UiDatePicker'
});

type Props = {
  modelValue?: Nullable<Date>;
  minValue?: Nullable<Date>;
  maxValue?: Nullable<Date>;
  time?: boolean;
  datetime?: boolean;
  range?: boolean;
  min?: Date;
  max?: Date;
};

type CalendarView = 'calendar' | 'months' | 'years';

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: Date): void;
  (e: 'update:minValue', value: Date): void;
  (e: 'update:maxValue', value: Date): void;
}>();

const dayjs = useDayjs();
const state = reactive({
  internalValue: dayjs(props.modelValue),
  hoveredCell: null as Nullable<Dayjs>,
  range: [] as Dayjs[],
  view: 'calendar' as CalendarView
});

const vModel = useVModel(props, 'modelValue', emit);
const minVModel = useVModel(props, 'minValue', emit);
const maxVModel = useVModel(props, 'maxValue', emit);

watchEffect(() => {
  if (props.modelValue && props.range) {
    console.warn(
      'UiDatePicker: modelValue is ignored when using the `range` prop'
    );
  }
  if ((props.minValue || props.maxValue) && !props.range) {
    console.warn(
      'UiDatePicker: minValue and maxValue are ignored when not using the `range` prop'
    );
  }
  if (props.datetime && props.time) {
    console.warn('UIDatePicker: time and datetime props cannot both be true');
  }
});

const { modelValue, minValue, maxValue } = toRefs(props);
const timeVModel = useTimePicker(modelValue!, vModel);
const minTimeVModel = useTimePicker(minValue!, minVModel);
const maxTimeVModel = useTimePicker(maxValue!, maxVModel);

const selectDay = (day: Dayjs) => {
  if (props.range) {
    state.range.push(day);
  } else {
    const timestamp = dayjs(props.modelValue)
      .year(day.year())
      .month(day.month())
      .date(day.date())
      .valueOf();

    vModel.value = new Date(timestamp);
  }
};

const goToMonth = (month: number) => {
  state.internalValue = state.internalValue.month(month);
  state.view = 'calendar';
};

const goToYear = (year: number) => {
  state.internalValue = state.internalValue.year(year);
  state.view = 'months';
};

const goToPrevMonth = () => {
  state.internalValue = state.internalValue.subtract(1, 'month');
};
const goToNextMonth = () => {
  state.internalValue = state.internalValue.add(1, 'month');
};

const switchView = () => {
  if (state.view === 'calendar') state.view = 'months';
  else if (state.view === 'months') state.view = 'years';
  else if (state.view === 'years') state.view = 'calendar';
};

const commitRange = () => {
  if (state.range.length !== 2) return;

  const [min, max] = state.range
    .slice()
    .sort((a: Dayjs, b: Dayjs) => (a.isBefore(b) ? -1 : 1));

  minVModel.value = new Date(min!.startOf('day').valueOf());
  maxVModel.value = new Date(max!.endOf('day').valueOf());
  state.range.splice(0, 2);
};

watchEffect(commitRange);

const { t } = useI18n();
</script>

<template>
  <div class="ui-datepicker">
    <header v-if="!time">
      <UiIconButton
        icon="material-symbols:chevron-left"
        title="mois précédent"
        @click="goToPrevMonth"
      />
      <button class="view-switcher-button" @click="switchView">
        {{ state.internalValue.format('MMMM YYYY') }}
      </button>
      <UiIconButton
        icon="material-symbols:chevron-right"
        title="mois suivant"
        @click="goToNextMonth"
      />
    </header>

    <div v-if="!time" class="view-container">
      <Transition>
        <UiDatePickerCalendarView
          v-if="state.view === 'calendar'"
          :model-value="vModel"
          :min-value="minVModel"
          :max-value="maxVModel"
          :selected-range="state.range"
          :position="state.internalValue"
          :min="props.min"
          :max="props.max"
          :range="props.range"
          @cell-click="selectDay($event)"
        />

        <UiDatePickerMonthView
          v-else-if="state.view === 'months'"
          :position="state.internalValue"
          @cell-click="goToMonth($event)"
        />

        <UiDatePickerYearView
          v-else-if="state.view === 'years'"
          :position="state.internalValue"
          @cell-click="goToYear($event)"
        />
      </Transition>
    </div>

    <footer>
      <UiDatePickerTime
        v-if="!props.range && (props.datetime || props.time)"
        id="date-picker-time"
        v-model="timeVModel"
        :disabled="!props.modelValue"
      >
        <template #label>
          <span v-show="vModel">
            {{ dayjs(vModel).format('D MMM YYYY') }}
          </span>
        </template>
      </UiDatePickerTime>

      <template v-if="props.range && props.datetime">
        <UiDatePickerTime
          id="date-picker-time-start"
          v-model="minTimeVModel"
          :disabled="!props.minValue"
        >
          <template #label>
            <div class="time-picker-label">{{ t('datePicker.time.from') }}</div>
            <span v-show="minVModel">
              {{ dayjs(minVModel).format('D MMM YYYY') }}
            </span>
          </template>
        </UiDatePickerTime>
        <UiDatePickerTime
          id="date-picker-time-end"
          v-model="maxTimeVModel"
          :disabled="!props.maxValue"
        >
          <template #label>
            <div class="time-picker-label">{{ t('datePicker.time.to') }}</div>
            <span v-show="maxVModel">
              {{ dayjs(maxVModel).format('D MMM YYYY') }}
            </span>
          </template>
        </UiDatePickerTime>
      </template>
    </footer>
  </div>
</template>

<style lang="postcss" scoped>
@import '@/styles/medias.css';
.ui-datepicker {
  width: fit-content;
  max-width: 100vw;
  background-color: var(--surface-1);
  border: solid 1px var(--border-dimmed);
  @media (--md-n-above) {
    display: grid;
    grid-template-columns: auto auto;
    grid-template-rows: auto auto;
  }

  & > header {
    grid-row: 1;
    grid-column: 1;
    display: grid;
    grid-template-columns: auto 1fr auto;
    justify-items: center;
    align-items: center;
    font-weight: var(--font-weight-5);
    font-size: var(--font-size-3);
    padding: var(--size-1);
  }

  & > footer {
    grid-column: 2;
    grid-row: 2;
  }
}
.view-switcher-button {
  background-color: transparent;
}

.view-container {
  --calendar-cell-size: var(--size-8);
  grid-row: 2;
  grid-column: 1;
  display: grid;
  aspect-ratio: 1;
  overflow-x: hidden;
  position: relative;
  width: calc(7 * var(--calendar-cell-size) + 2 * var(--size-2));
  aspect-ratio: 1;
  padding: var(--size-2);

  & > * {
    grid-column: 1;
    grid-row: 1;
  }

  & .v-enter-active,
  & .v-leave-active {
    transition: opacity 0.2s;
  }

  & .v-enter-from,
  & .v-leave-to {
    opacity: 0;
  }
}

.time-picker-label {
  font-size: var(--font-size-0);
}
</style>
