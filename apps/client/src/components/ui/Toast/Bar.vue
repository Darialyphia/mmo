<script setup lang="ts">
import type { ToastPlacement } from '@/composables/useToast';

defineOptions({
  name: 'UiToastBar'
});
const { toasts, clear } = useToast();

const getToastsByPlacement = (placement: ToastPlacement) => {
  return toasts.value.filter(t => t.placement === placement);
};
</script>

<template>
  <Teleport to="body">
    <div id="toast-bar-left" class="ui-toast-bar left">
      <TransitionGroup appear>
        <UiToast
          v-for="toast in getToastsByPlacement('left')"
          :key="toast.id"
          :toast="toast"
          is-opened
          @update:is-opened="clear(toast.id)"
        />
      </TransitionGroup>
    </div>
    <div id="toast-bar-right" class="ui-toast-bar right">
      <TransitionGroup appear>
        <UiToast
          v-for="toast in getToastsByPlacement('right')"
          :key="toast.id"
          :toast="toast"
          is-opened
          @update:is-opened="clear(toast.id)"
        >
          <div>
            <strong>{{ toast.title }}</strong>
            <div min-h-1rem>
              {{ toast.text }}
            </div>
          </div>
        </UiToast>
      </TransitionGroup>
    </div>
    <div id="toast-bar-top" class="ui-toast-bar top">
      <TransitionGroup appear>
        <UiToast
          v-for="toast in getToastsByPlacement('top')"
          :key="toast.id"
          :toast="toast"
          is-opened
          @update:is-opened="clear(toast.id)"
        >
          <div>
            <strong>{{ toast.title }}</strong>
            <div min-h-1rem>
              {{ toast.text }}
            </div>
          </div>
        </UiToast>
      </TransitionGroup>
    </div>
    <div id="toast-bar-bottom" class="ui-toast-bar bottom">
      <TransitionGroup appear>
        <UiToast
          v-for="toast in getToastsByPlacement('bottom')"
          :key="toast.id"
          :toast="toast"
          is-opened
          @update:is-opened="clear(toast.id)"
        >
          <div>
            <strong>{{ toast.title }}</strong>
            <div min-h-1rem>
              {{ toast.text }}
            </div>
          </div>
        </UiToast>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped lang="postcss">
@import 'open-props/media';

.v-enter-active,
.v-leave-active,
.v-move {
  transition: all 0.3s;
}
.v-enter-from,
.v-leave-to {
  opacity: 0;
  transform: var(--_transform);
}
.ui-toast-bar {
  position: fixed;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: var(--size-5);
  align-items: center;
  &.left {
    top: var(--size-10);
    left: var(--size-7);
    @media (--md-n-below) {
      left: 0;
      top: 0;
    }
  }
  &.right {
    top: var(--size-10);
    right: var(--size-7);
    @media (--md-n-below) {
      right: 0;
      top: 0;
    }
  }
  &.top {
    left: 50%;
    top: var(--size-7);
    transform: translateX(-50%);
    @media (--md-n-below) {
      top: 0;
    }
  }
  &.bottom {
    left: 50%;
    bottom: var(--size-7);
    transform: translateX(-50%);
    @media (--md-n-below) {
      bottom: 0;
    }
  }
}
</style>
