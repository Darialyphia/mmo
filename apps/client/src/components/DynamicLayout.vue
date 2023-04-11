<script setup lang="ts">
import { isString } from '@mmo/shared';
import type { Component as VueComponent } from 'vue';

const layoutMap = new Map<string, VueComponent>();
layoutMap.set(
  'default',
  defineAsyncComponent(() => import('@/components/layouts/default.vue'))
);

const route = useRoute();
const layoutComponent = computed(() => {
  const key = isString(route.meta.layout) ? route.meta.layout : 'default';
  const layout = layoutMap.get(key);

  return layout || layoutMap.get('default');
});
const router = useRouter();

await router.isReady();
</script>

<template>
  <component :is="layoutComponent">
    <UiToastBar />

    <router-view v-slot="{ Component }">
      <transition :name="route.meta.transition as string ?? ''" mode="out-in">
        <component :is="Component" :key="route.path" />
      </transition>
    </router-view>
  </component>
</template>

<style scoped lang="postcss">
.fullpage-loader {
  height: 100vh;
}

.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.5s ease, all 0.3s ease;
}

.slide-right-enter-from {
  transform: translateX(-25%) scale(0.75);
  opacity: 0;
}

.slide-right-leave-to {
  transform: translateX(25%) scale(0.75);
  opacity: 0;
}

.slide-left-enter-from {
  transform: translateX(25%) scale(0.75);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(-25%) scale(0.75);
  opacity: 0;
}
</style>
