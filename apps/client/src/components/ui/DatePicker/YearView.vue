<script setup lang="ts">
import { KEYBOARD } from '@/utils/dom';
import type { Nullable } from '@mmo/shared';
import type { Dayjs } from 'dayjs';

defineOptions({
  name: 'UiDatePickerYearView'
});

const props = defineProps<{
  position: Dayjs;
}>();

const emit = defineEmits<{
  (e: 'cell-click', value: number): void;
}>();

const years = Array.from({ length: 151 }, (_, index) => 1900 + index);
const yearViewEl = ref<Nullable<HTMLElement>>();

const scrollToYear = () => {
  if (!yearViewEl.value) return;
  const view = yearViewEl.value;
  const button = view.querySelector<HTMLButtonElement>(
    `[data-year="${props.position.year()}"]`
  );
  button?.focus();
};

watchEffect(scrollToYear);

const activeElement = useActiveElement();
const navigate = (e: KeyboardEvent) => {
  if (activeElement.value === yearViewEl.value) {
    return scrollToYear();
  }

  if (e.code === KEYBOARD.ArrowUp) {
    e.preventDefault();
    const li = activeElement.value?.parentElement
      ?.previousElementSibling as HTMLElement;
    const button = li?.firstElementChild as HTMLElement;
    button?.focus();
  }

  if (e.code === KEYBOARD.ArrowDown) {
    e.preventDefault();
    const li = activeElement.value?.parentElement
      ?.nextElementSibling as HTMLElement;
    const button = li?.firstElementChild as HTMLElement;
    button?.focus();
  }
};
</script>

<template>
  <!--eslint-disable-next-line vuejs-accessibility/no-static-element-interactions -->
  <ul ref="yearViewEl" class="years-view" tabindex="0" @keydown="navigate">
    <li v-for="year in years" :key="year">
      <UiButton
        :data-year="year"
        tabindex="-1"
        :variant="props.position.year() === year ? 'light' : 'ghost'"
        :size="props.position.year() === year ? 'lg' : 'md'"
        @click="emit('cell-click', year)"
      >
        {{ year }}
      </UiButton>
    </li>
  </ul>
</template>

<style scoped lang="postcss">
.years-view {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  overflow-y: auto;
  padding-inline: var(--size-2);

  & button {
    width: 100%;
  }
}
</style>
