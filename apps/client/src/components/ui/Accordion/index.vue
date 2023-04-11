<script lang="ts" setup>
import type { AccordionOpenedIndex } from '@/composables/useAccordion';

defineOptions({
  name: 'UiAccordion'
});

const props = withDefaults(
  defineProps<{
    modelValue?: AccordionOpenedIndex;
  }>(),
  {
    modelValue: null
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: AccordionOpenedIndex): void;
}>();

const vModel = useVModel(props, 'modelValue', emit);

useAccordionProvider(vModel);
</script>

<template>
  <slot />
</template>
