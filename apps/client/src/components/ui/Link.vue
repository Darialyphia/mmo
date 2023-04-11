<script setup lang="ts">
import type { RouterLinkProps } from 'vue-router/auto';
import { RouterLink } from 'vue-router/auto';

defineOptions({
  name: 'UiLink'
});

const props = defineProps<RouterLinkProps>();
</script>

<template>
  <RouterLink v-bind="(props as any)" class="ui-link"><slot /></RouterLink>
</template>

<style scoped lang="postcss">
.ui-link {
  font-weight: var(--font-weight-6);
  color: var(--primary);

  &:hover {
    text-decoration: underline;
  }
}
</style>
