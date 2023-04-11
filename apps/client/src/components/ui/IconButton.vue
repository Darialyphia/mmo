<script setup lang="ts">
import type { RouterLinkProps } from 'vue-router/auto';
import { Icon } from '@iconify/vue';

defineOptions({
  name: 'UiIconButton'
});

const props = withDefaults(
  defineProps<{
    variant?: 'full' | 'outlined' | 'ghost' | 'light';
    to?: RouterLinkProps['to'];
    icon: string;
    title: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    isLoading?: boolean;
  }>(),
  {
    variant: 'ghost',
    to: undefined,
    size: 'md'
  }
);

const buttonProps = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { icon, ...rest } = props;
  return rest;
});
</script>

<template>
  <UiButton
    class="ui-icon-button"
    v-bind="buttonProps"
    :title="props.title"
    :aria-label="props.title"
  >
    <Icon :icon="props.icon" />
  </UiButton>
</template>

<style scoped lang="postcss">
.ui-button.ui-icon-button {
  border-radius: var(--radius-round);
  padding: var(--size-1);

  & > * {
    width: 1.5em;
    aspect-ratio: 1;
  }
}
</style>
