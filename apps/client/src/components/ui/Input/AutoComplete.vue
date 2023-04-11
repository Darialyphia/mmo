<script setup lang="ts">
import type { Nullable } from '@mmo/shared';

defineOptions({
  name: 'UiInputSelect'
});

type Props = {
  modelValue: Nullable<any>;
  search: Nullable<string>;
  name?: string;
  options: {
    label: string;
    value: any;
  }[];
};

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void;
  (e: 'update:search', value: string): void;
}>();

const searchVModel = useVModel(props, 'search', emit);
const isOpened = ref(false);
const id = useNanoId();
</script>

<template>
  <UiDropdown
    v-model:is-opened="isOpened"
    placement="bottom-start"
    :offset="0"
    class="foo"
  >
    <!-- eslint-disable-next-line vue/no-unused-vars -->
    <template #toggle="{ props: { onClick, ...slotProps }, ref }">
      <UiInputText
        :id="id"
        :ref="ref"
        v-model="searchVModel"
        v-bind="slotProps"
        right-icon="prime:chevron-down"
        @focus="isOpened = true"
      />
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

<style lang="postcss">
.ui-dropdown-item {
  text-align: left;
}
</style>
