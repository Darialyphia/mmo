import type { MaybeRef } from '@vueuse/shared';
import { onUnmounted, watchEffect, unref } from 'vue';
import { isMobile } from '@/utils/browser';

export const useBodyScrollLock = (isLocked: MaybeRef<boolean>) => {
  const cleanup = () => {
    document.body.style.removeProperty('overflow');
    document.body.style.paddingRight = '';
  };

  const getScrollbarWidth = () =>
    window.innerWidth - document.documentElement.clientWidth;

  watchEffect(() => {
    if (unref(isLocked)) {
      if (!isMobile) {
        document.body.style.paddingRight = `${getScrollbarWidth()}px`;
      }

      document.body.style.overflow = 'hidden';
    } else {
      cleanup();
    }
  });

  onUnmounted(cleanup);
};
