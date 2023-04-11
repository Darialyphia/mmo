<script setup lang="ts">
import { RouterLink } from 'vue-router/auto';
import { Icon } from '@iconify/vue';
import type { Toast } from '@/composables/useToast';

defineOptions({
  inheritAttrs: false,
  name: 'UiToast'
});

const props = withDefaults(
  defineProps<{
    isOpened: boolean;
    toast: Toast;
    hasProgressBar?: boolean;
  }>(),
  {
    hasProgressBar: true
  }
);
const emit = defineEmits<{
  (e: 'update:isOpened', value: boolean): void;
}>();
const vModel = useVModel(props, 'isOpened', emit);
const toastEl = ref<HTMLElement>();
const { direction, isSwiping } = usePointerSwipe(toastEl, {
  threshold: 50
});
watchEffect(() => {
  if (!isSwiping.value) return;
  nextTick(() => {
    const isSwipeX = ['LEFT', 'RIGHT'].includes(direction.value as any);
    const isSwipeY = ['UP', 'DOWN'].includes(direction.value as any);
    if (
      (isSwipeX && ['left', 'right'].includes(props.toast.placement)) ||
      (isSwipeY && ['top', 'bottom'].includes(props.toast.placement))
    ) {
      vModel.value = false;
    }
  });
});

const progressBarAnimDuration = computed(() => `${props.toast.timeout}ms`);
</script>

<template>
  <div
    v-if="props.isOpened"
    ref="toastEl"
    class="ui-toast-wrapper"
    :class="[props.toast.placement, props.toast.type]"
    :style="{ '--progress-bar-anim-duration': progressBarAnimDuration }"
    @pointerdown.stop
    @pointermove.stop
    @pointerup.stop
  >
    <UiSurface class="ui-toast" role="status" v-bind="$attrs">
      <Icon :icon="props.toast.icon" class="icon" />

      <component
        :is="props.toast.link ? RouterLink : 'div'"
        :to="props.toast.link"
        class="content"
        @click="vModel = false"
      >
        <strong>{{ props.toast.title }}</strong>
        <div>
          {{ props.toast.text }}
        </div>
      </component>

      <UiIconButton
        title="dismiss toast"
        icon="mdi:close"
        class="close-button"
        @click="vModel = false"
      />

      <div v-if="props.hasProgressBar" class="progress" />
    </UiSurface>
  </div>
</template>

<style scoped lang="postcss">
@import 'open-props/media';
.ui-toast-wrapper {
  width: var(--size-content-3);
  &.info {
    --_color: var(--primary);
  }
  &.success {
    --_color: var(--teal-6);
  }
  &.warning {
    --_color: var(--orange-5);
  }
  &.danger {
    --_color: var(--red-9);
  }
  &.left {
    --_transform: translateX(-50%);
  }
  &.right {
    --_transform: translateX(50%);
  }
  &.top {
    --_transform: translateY(-50%);
  }
  &.bottom {
    --_transform: translateY(50%);
  }
  @media (--md-n-below) {
    width: 100vw;
  }
}
.ui-toast {
  padding: var(--size-2) var(--size-3);
  border-radius: var(--radius-2);
  outline: solid 1px var(--border-dimmed);
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--size-4);
  user-select: none;
  cursor: grab;
  .ui-toast-wrapper.bottom & {
    border-top: solid 8px var(--_color);
  }
  .ui-toast-wrapper.top & {
    border-bottom: solid 8px var(--_color);
  }
  .ui-toast-wrapper.left & {
    border-right: solid 8px var(--_color);
  }
  .ui-toast-wrapper.right & {
    border-left: solid 8px var(--_color);
  }
  & .content {
    color: inherit;
    text-decoration: none;
  }
  & .close-button {
    margin-inline-start: auto;
    margin-block-start: calc(-1 * var(--size-2));
    align-self: start;
  }
  & .icon {
    padding: var(--size-2);
    border-radius: var(--radius-round);
    aspect-ratio: 1;
    width: var(--size-8);
    display: grid;
    place-content: center;
    color: var(--gray-0);
    color: var(--surface-1);
    background-color: var(--_color);
  }
  & .progress {
    grid-column: 1 / -1;
    height: 5px;
    background: hsl(var(--red-6-hsl) / 0.6);
    transform-origin: left;
    transform: scaleX(0);
    animation: toast-progress-bar var(--progress-bar-anim-duration) linear;
  }
}
@keyframes toast-progress-bar {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}
</style>
