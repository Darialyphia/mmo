<script setup lang="ts">
import type { RouterLinkProps } from 'vue-router/auto';
import { RouterLink } from 'vue-router/auto';
import { Icon } from '@iconify/vue';

defineOptions({
  name: 'UiButton'
});

type Props = {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  pill?: boolean;
  variant?: 'full' | 'outlined' | 'ghost' | 'light';
  isPill?: boolean;
  to?: RouterLinkProps['to'];
};

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  leftIcon: undefined,
  rightIcon: undefined,
  isLoading: false,
  variant: 'full',
  to: undefined
});

const attrs = useAttrs();

const tag = computed(() => {
  if (props.to) return RouterLink;
  if (attrs.href) return 'a';

  return 'button';
});
</script>

<template>
  <component
    :is="tag"
    :to="props.to"
    class="ui-button"
    :class="[
      `ui-button--${props.variant}`,
      `ui-button--${props.size}`,
      props.isPill && 'pill'
    ]"
    :disabled="attrs.disabled || props.isLoading"
  >
    <Icon
      v-if="props.leftIcon && !props.isLoading"
      :icon="props.leftIcon"
      aria-hidden="true"
      class="icon"
    />

    <UiSpinner v-if="props.isLoading" />
    <slot v-else />

    <Icon
      v-if="props.rightIcon && !props.isLoading"
      :icon="props.rightIcon"
      aria-hidden="true"
      class="icon"
    />
  </component>
</template>

<style scoped lang="postcss">
.ui-button {
  cursor: pointer;
  white-space: nowrap;
  vertical-align: middle;
  padding: 0.5em 1em;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--size-2);
  font-weight: var(--font-weight-6);
  border-radius: var(--radius-2);
  border: solid 1px transparent;

  &,
  &:hover {
    text-decoration: none;
  }

  &:disabled {
    cursor: not-allowed;
  }

  &.sm {
    font-size: var(--font-size-0);
  }

  &.md {
    font-size: var(--font-size-1);
  }

  &.lg {
    font-size: var(--font-size-3);
  }

  &.xl {
    font-size: var(--font-size-5);
  }

  &.pill {
    border-radius: var(--radius-pill);
  }

  & > .icon {
    font-size: var(--font-size-4);
    aspect-ratio: 1;
    display: block;
  }
}

.ui-button--full {
  color: var(--text-on-primary);
  background-color: var(--primary);

  &:hover:not(:disabled) {
    background-color: var(--primary-hover);
  }

  &:disabled {
    background-color: var(--disabled);
    color: var(--text-disabled);
  }
}

.ui-button--outlined {
  background-color: transparent;
  color: var(--primary);
  border-color: currentColor;

  &:hover:not(:disabled) {
    background-color: hsl(var(--primary-hsl) / 0.08);
  }

  &:disabled {
    color: var(--text-disabled);
  }
}

.ui-button--ghost {
  background-color: transparent;
  color: inherit;

  &:hover:not(:disabled) {
    background-color: hsl(var(--primary-hsl) / 0.08);
  }

  &:disabled {
    color: var(--text-disabled);
  }
}

.ui-button--light {
  color: var(--primary);
  background-color: hsl(var(--primary-light-hsl) / 0.3);

  &:hover:not(:disabled) {
    background-color: hsl(var(--primary-hsl) / 0.3);
  }

  &:disabled {
    background-color: hsl(var(--disabled-hsl) / 0.3);
    color: var(--text-disabled);
  }
}

.ui-button--sm {
  font-size: var(--font-size-0);
}

.ui-button--md {
  font-size: var(--font-size-1);
}

.ui-button--lg {
  font-size: var(--font-size-3);
}

.ui-button--xl {
  font-size: var(--font-size-5);
}
</style>
