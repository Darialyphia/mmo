<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue';

const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW();
const close = async () => {
  offlineReady.value = false;
  needRefresh.value = false;
};
const { t } = useI18n();
</script>

<template>
  <Transition appear>
    <UiSurface
      v-if="offlineReady || needRefresh"
      role="alert"
      class="service-worker-prompt"
    >
      <span v-if="offlineReady">{{ t('pwa.offlineReady') }}</span>
      <span v-else>
        {{ t('pwa.newContentAvailable') }}
      </span>

      <footer>
        <UiButton
          v-if="needRefresh"
          variant="ghost"
          left-icon="ic:baseline-refresh"
          @click="updateServiceWorker()"
        >
          {{ t('pwa.reload') }}
        </UiButton>
        <UiButton
          variant="ghost"
          left-icon="material-symbols:arrow-right-alt"
          @click="close"
        >
          {{ t('pwa.close') }}
        </UiButton>
      </footer>
    </UiSurface>
  </Transition>
</template>

<style scoped lang="postcss">
.service-worker-prompt {
  position: fixed;
  bottom: 0;
  right: 0;
  margin: var(--size-8);
  box-shadow: var(--shadow-3);
  border: solid 1px var(--border);
  z-index: 1;

  & > footer {
    margin-block-start: var(--size-4);
    display: flex;
    justify-content: flex-end;
    gap: var(--size-3);
  }

  &.v-enter-active {
    animation: bounce-in 0.5s;
  }
  &.v-leave-active {
    animation: bounce-in 0.5s reverse;
  }
}
@keyframes bounce-in {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
  }
}
</style>
