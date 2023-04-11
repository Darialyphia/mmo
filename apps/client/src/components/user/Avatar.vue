<script setup lang="ts">
import type { UserResponse } from '@mmo/shared';

const props = defineProps<{ user: UserResponse }>();
</script>

<template>
  <button>{{ props.user.firstname?.slice(0, 1).toLocaleUpperCase() }}</button>
</template>

<style scoped lang="postcss">
button {
  background-color: transparent;
  border: none;
  background-color: var(--primary-light);
  color: var(--primary);
  aspect-ratio: 1;
  border-radius: var(--radius-round);
  font-size: var(--font-size-5);
}
</style>
