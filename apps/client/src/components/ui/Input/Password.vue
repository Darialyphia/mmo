<script setup lang="ts">
import type { Nullable } from '@mmo/shared';

defineOptions({
  name: 'UiInputPassword'
});

const props = defineProps<{
  name?: string;
  id: string;
  modelValue: Nullable<string>;
}>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const vModel = useVModel(props, 'modelValue', emit);
const isPasswordShown = ref(false);
const type = computed(() => (isPasswordShown.value ? 'text' : 'password'));

const slots = useSlots();
</script>

<template>
  <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -->
  <UiInputText
    :id="props.id"
    v-model="vModel"
    :name="props.name"
    :type="type"
    class="ui-input-password"
  >
    <template v-if="slots.left" #left><slot name="left" /></template>

    <template #right>
      <UiIconButton
        type="button"
        title="toggle password"
        :icon="isPasswordShown ? 'mdi-eye-off' : 'mdi-eye'"
        class="ui-input-password_toggle"
        @click="isPasswordShown = !isPasswordShown"
      />
    </template>
  </UiInputText>
</template>

<style scoped lang="postcss">
.ui-input-password.error button {
  color: var(--error);
}
</style>
