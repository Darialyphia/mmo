<script setup lang="ts">
import { Icon } from '@iconify/vue';

defineOptions({
  name: 'UiFormError'
});

const props = defineProps<{ error?: string }>();
</script>

<template>
  <transition appear>
    <div class="ui-form-error">
      <Icon icon="mdi-alert" />
      <span>{{ props.error }}</span>
    </div>
  </transition>
</template>

<style scoped lang="postcss">
.ui-form-error {
  color: var(--error);
  gap: var(--size-2);
  transition: opacity 0.2s;
  min-height: 1.5em;

  & > svg {
    float: left;
    margin-inline-end: var(--size-2);
    padding-top: var(--size-1);
  }

  &.v-enter-active,
  &.v-leave-active {
    transition: opacity 0.2s;
  }

  &.v-enter-from,
  &.v-leave-to {
    opacity: 0;
  }
}
</style>
