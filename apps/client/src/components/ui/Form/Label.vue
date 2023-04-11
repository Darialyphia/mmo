<script setup lang="ts">
const props = defineProps<{ for: string; isGroup?: boolean }>();

defineOptions({
  name: 'UiFormLabel'
});

const tag = computed(() => (props.isGroup ? 'legend' : 'label'));
</script>

<template>
  <component :is="tag" :for="props.for" class="ui-form-label">
    <slot />
  </component>
</template>

<style scoped>
.ui-form-label {
  font-weight: var(--font-weight-5);
}
</style>
