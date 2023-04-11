<script setup lang="ts">
import { useField } from 'vee-validate';

defineOptions({
  name: 'UiFormControl'
});

const props = defineProps<{
  name: string;
  id: string;
  label?: string;
  isGroup?: boolean;
  validateOnChange?: boolean;
  keepValueOnUnmount?: boolean;
}>();
const { value, errorMessage, meta, handleChange, handleBlur } = useField(
  toRef(props, 'name'),
  undefined,
  {
    keepValueOnUnmount: props.keepValueOnUnmount
  }
);

const slotProps = computed(() => ({
  id: props.id,
  name: props.name,
  modelValue: value.value as any,
  'onUpdate:modelValue'(val: any) {
    value.value = val;
  },
  onChange: props.validateOnChange
    ? (e: unknown) => handleChange(e, true)
    : undefined,
  onBlur: handleBlur,
  isError: !!errorMessage.value && meta.touched
}));
</script>

<template>
  <fieldset class="ui-form-control">
    <slot name="label">
      <UiFormLabel v-if="props.label" :for="props.id" :is-group="props.isGroup">
        {{ props.label }}
      </UiFormLabel>
    </slot>
    <slot v-bind="slotProps" />
    <UiFormError
      v-if="errorMessage && meta.touched"
      :error="errorMessage"
      :data-testid="`${props.name}-error`"
    />
  </fieldset>
</template>

<style scoped lang="postcss">
.ui-form-control {
  border: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--size-2);
  & > legend {
    float: left;
  }
}
</style>
