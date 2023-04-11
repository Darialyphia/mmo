<script setup lang="ts">
import { KEYBOARD, getFocusableChildren } from '@/utils/dom';
import { clamp } from '@mmo/shared';
import type { Dayjs } from 'dayjs';

defineOptions({
  name: 'UiDatePickerMonthView'
});

const props = defineProps<{
  position: Dayjs;
}>();
const emit = defineEmits<{
  (e: 'cell-click', value: number): void;
}>();

const dayjs = useDayjs();

const months = computed(() => dayjs.localeData().months());
const root = ref<HTMLElement>();
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
  const focusable = getFocusableChildren(root.value);
  if (activeElement.value === root.value) {
    return focusable[0]?.focus();
  }
  if (!focusable.includes(activeElement.value)) return;

  e.preventDefault();
  let index = focusable.indexOf(activeElement.value);

  switch (e.code) {
    case KEYBOARD.ArrowDown:
      index += 3;
      break;
    case KEYBOARD.ArrowUp:
      index -= 3;
      break;
    case KEYBOARD.ArrowLeft:
      index -= 3;
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
  <div ref="root" class="months-view" tabindex="0" @keydown="navigate">
    <UiButton
      v-for="(month, index) in months"
      :key="month"
      tabindex="-1"
      :variant="props.position.month() === index ? 'light' : 'ghost'"
      :data-month="index"
      @click="emit('cell-click', index)"
    >
      {{ month }}
    </UiButton>
  </div>
</template>

<style scoped lang="postcss">
.months-view {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  aspect-ratio: 1;
}
</style>
