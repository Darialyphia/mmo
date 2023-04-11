<script setup lang="ts">
import { RouterLink, type RouterLinkProps } from 'vue-router/auto';

defineOptions({
  name: 'UiDropdownItem'
});

const props = withDefaults(
  defineProps<{
    closeOnClick?: boolean;
    to?: RouterLinkProps['to'];
  }>(),
  {
    closeOnClick: true,
    icon: '',
    to: null as any
  }
);

const onClick = (e: MouseEvent) => {
  if (!props.closeOnClick) e.stopPropagation();
};

const attrs = useAttrs();
const is = computed(() => {
  if (props.to) return RouterLink;
  if (attrs.onClick) return 'button';

  return 'div';
});
</script>
<template>
  <component
    :is="is"
    :to="props.to"
    class="ui-dropdown-item"
    role="menuitem"
    tabindex="-1"
    @click="onClick"
  >
    <div>
      <slot />
    </div>
  </component>
</template>

<style scoped lang="postcss">
.ui-dropdown-item {
  align-items: center;
  gap: var(--size-3);
  padding: var(--size-2) var(--size-3);
  user-select: none;
  text-decoration: none;
  color: inherit;
  background-color: inherit;
  width: 100%;

  &:hover {
    background-color: var(--surface-2);
  }
}
</style>
