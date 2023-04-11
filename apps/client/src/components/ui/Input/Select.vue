<script setup lang="ts">
import type { Nullable } from '@mmo/shared';

defineOptions({
  name: 'UiInputSelect'
});

type Props = {
  modelValue: Nullable<any>;
  name?: string;
  options: {
    label: string;
    value: any;
  }[];
};

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void;
}>();

const isOpened = ref(false);

const { t } = useI18n();

const selectedLabel = computed(
  () =>
    props.options.find(v => v.value === props.modelValue)?.label ??
    t('inputSelect.defaultLabel')
);
</script>

<template>
  <UiDropdown v-model:is-opened="isOpened">
    <template #toggle="{ props: slotProps, ref }">
      <UiButton
        :ref="ref"
        v-bind="slotProps"
        variant="ghost"
        right-icon="prime:chevron-down"
        class="ui-select-toggle"
      >
        {{ selectedLabel }}
      </UiButton>
    </template>

    <template #menu>
      <UiDropdownItem
        v-for="option in options"
        :key="option.value"
        @click="emit('update:modelValue', option.value)"
      >
        {{ option.label }}
      </UiDropdownItem>
    </template>
  </UiDropdown>
</template>

<style scoped lang="postcss">
.ui-select-toggle {
  &.ui-button {
    justify-content: space-between;
    border: solid 1px var(--border-dimmed);
    font-weight: var(--font-weight-4);
  }
}
.ui-dropdown-item {
  text-align: left;
}
</style>
