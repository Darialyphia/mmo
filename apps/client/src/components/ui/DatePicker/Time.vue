<script setup lang="ts">
import { KEYBOARD } from '@/utils/dom';
import { clamp } from '@mmo/shared';

defineOptions({
  name: 'UiDatePickerTime'
});

type Props = {
  id: string;
  modelValue: string;
  disabled?: boolean;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const HOUR_REGEX = '(?:2[0-3]|[01][0-9])';
const MINUTES_REGEX = '[0-5][0-9]';
const TIME_REGEX = new RegExp(`^${HOUR_REGEX}:${MINUTES_REGEX}$`);

const internal = ref(props.modelValue);
const isValid = computed(() => TIME_REGEX.test(internal.value));

watch(internal, internal => {
  if (isValid.value) emit('update:modelValue', internal);
});

watchEffect(() => {
  internal.value = props.modelValue;
});

whenever(
  () => new RegExp(`^${HOUR_REGEX}$`).test(internal.value),
  () => {
    internal.value += ':';
  }
);

const onKeydown = (e: KeyboardEvent) => {
  const target = e.target as HTMLInputElement;
  const start = target.selectionStart;
  if (!isValid.value) return;
  if (!start) return;
  let [hour, minute]: [string, string] = target.value.split(':') as [
    string,
    string
  ];

  if (e.code === KEYBOARD.ArrowDown) {
    e.preventDefault();

    if (start <= 2) {
      hour = clamp(parseInt(hour) - 1, 0, 23)
        .toString()
        .padStart(2, '0');
    }
    if (start > 2) {
      minute = clamp(parseInt(minute) - 1, 0, 59)
        .toString()
        .padStart(2, '0');
    }
  }
  if (e.code === KEYBOARD.ArrowUp) {
    e.preventDefault();
    if (start < 2) {
      hour = clamp(parseInt(hour) + 1, 0, 23)
        .toString()
        .padStart(2, '0');
    }
    if (start > 2) {
      minute = clamp(parseInt(minute) + 1, 0, 59)
        .toString()
        .padStart(2, '0');
    }
  }

  internal.value = `${hour}:${minute}`;
  nextTick(() => {
    target.setSelectionRange(start, start);
  });
};
</script>

<template>
  <fieldset>
    <legend>
      <slot name="label" />
    </legend>
    <UiInputText
      :id="`${props.id}-hour`"
      v-model="internal"
      autocomplete="off"
      left-icon="material-symbols:alarm-outline"
      placeholder="hh:mm"
      :disabled="props.disabled"
      :is-error="!isValid"
      @keydown="onKeydown"
    />
  </fieldset>
</template>

<style lang="postcss" scoped>
fieldset {
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: var(--size-3);
  padding: 0 0 var(--size-3);
  border: none;

  & legend {
    flex-grow: 1;
    font-weight: var(--font-weight-5);
    padding: 0;
    display: table-cell;
    width: 100%;
  }

  & span {
    padding-block: var(--size-2);
  }

  & .ui-input-text {
    width: var(--size-12);
    margin-block-start: var(--size-2);

    &.error:deep(svg) {
      color: var(--error);
    }
  }
}
</style>
