<script setup lang="ts">
import { useAuthGuard } from './composables/useAuthGuard';

const isOnline = useOnline();
const { showInfo, showDanger, clearAll } = useToast();
const { t } = useI18n();
watch(isOnline, (isOnline, prevIsOnline) => {
  if (isOnline && !prevIsOnline) {
    clearAll();
    return showInfo({
      title: t('network.toasts.online.title'),
      text: t('network.toasts.online.text'),
      placement: 'bottom',
      timeout: 10_000
    });
  }
  if (!isOnline) {
    showDanger({
      title: t('network.toasts.offline.title'),
      text: t('network.toasts.offline.text'),
      placement: 'bottom',
      timeout: false
    });
  }
});
</script>

<template>
  <Suspense>
    <DynamicLayout />

    <template #fallback>
      <UiCenter class="fullpage-loader">
        <UiSpinner />
      </UiCenter>
    </template>
  </Suspense>
</template>

<style scoped lang="postcss">
.fullpage-loader {
  height: 100vh;
}
</style>
