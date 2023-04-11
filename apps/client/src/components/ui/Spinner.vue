<script setup lang="ts">
import { Icon } from '@iconify/vue';

defineOptions({
  name: 'UiSpinner'
});

const props = withDefaults(
  defineProps<{ size?: 'sm' | 'md' | 'lg' | 'xl'; isDelayed?: boolean }>(),
  {
    size: 'md',
    isDelayed: false
  }
);

const delay = computed(() => (props.isDelayed ? '200ms' : 0));
</script>

<template>
  <Icon
    icon="svg-spinners:90-ring-with-bg"
    class="ui-spinner"
    :class="props.size"
  />
</template>

<style scoped lang="postcss">
@keyframes spinner {
  from {
    transform: rotateZ(0);
  }
  to {
    transform: rotateZ(1turn);
  }
}
@keyframes delay {
  from {
    visibility: hidden;
  }
  99% {
    visibility: hidden;
  }
  to {
    visibility: visible;
  }
}
.ui-spinner {
  animation: spinner 2s ease infinite, delay v-bind(delay);

  &.sm {
    font-size: var(--font-size-1);
  }

  &.md {
    font-size: var(--font-size-5);
  }

  &.lg {
    font-size: var(--font-size-8);
  }

  &.xl {
    font-size: var(--font-size-11);
  }
}
</style>
