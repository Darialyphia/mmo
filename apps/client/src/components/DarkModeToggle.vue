<script setup lang="ts">
import { Icon } from '@iconify/vue';

const isDarkMode = useLocalStorage('dark-mode', null);
const vModel = computed({
  get() {
    return JSON.parse(isDarkMode.value ?? 'false');
  },
  set(val: any) {
    isDarkMode.value = val;
    val
      ? document.documentElement.classList.add('dark')
      : document.documentElement.classList.remove('dark');
  }
});
</script>

<template>
  <UiInputSwitch id="dark-mode-toggle" v-model="vModel">
    <template #off>
      <Icon icon="ph:sun-fill" />
    </template>
    <template #on>
      <Icon icon="ph:moon-fill" />
    </template>
  </UiInputSwitch>
</template>

<style scoped lang="postcss">
.iconify {
  width: 1.5em;
  aspect-ratio: 1;
}
</style>
