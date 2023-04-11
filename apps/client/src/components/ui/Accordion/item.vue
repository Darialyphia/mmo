<script setup lang="ts">
import { useAccordion } from '@/composables/useAccordion';
import { Icon } from '@iconify/vue';

defineOptions({
  name: 'UiAccordionItem'
});

type Props = {
  label: string;
  icon?: string;
};
const props = defineProps<Props>();

const accordion = useAccordion();

const index = accordion.register();
const isOpened = computed(() => accordion.isOpened(index));

const contentElement = ref<HTMLElement>();
const contentHeight = ref<number | string>(0);

watch(
  isOpened,
  isOpened => {
    if (!isOpened) {
      contentHeight.value = 0;
      return;
    }

    nextTick(() => {
      if (!contentElement.value) return;
      contentHeight.value = `${contentElement.value.scrollHeight}px`;
    });
  },
  { immediate: true }
);

useMutationObserver(
  contentElement,
  () => {
    if (!isOpened.value) {
      return;
    }
    contentHeight.value = `${contentElement.value!.scrollHeight}px`;
  },
  {
    attributes: true,
    childList: true,
    subtree: true
  }
);
const hasTransition = ref(false);
onMounted(() => {
  if (!contentElement.value) return;
  if (isOpened.value) {
    // first resize the accordion, then make it animatable to avoid initial height transition
    contentHeight.value = `${contentElement.value.scrollHeight}px`;
    nextTick(() => {
      hasTransition.value = true;
    });
  }
});
</script>

<template>
  <div class="ui-accordion-item">
    <button class="toggle" @click="accordion.toggle(index)">
      <Icon v-if="props.icon" :icon="icon" class="left-icon" />

      <span>
        {{ props.label }}
      </span>

      <Icon
        icon="prime:chevron-down"
        :class="['toggle-icon', isOpened && 'is-opened']"
      />
    </button>

    <div
      ref="contentElement"
      class="content-wrapper"
      :class="hasTransition && 'animated'"
    >
      <div
        class="content"
        :class="props.icon && 'has-offset'"
        :inert="!isOpened"
      >
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
@import '@/styles/medias.css';

.ui-accordion-item {
  border-bottom: solid 1px var(--border-dimmed);
  padding-block-end: var(--size-3);
  margin-block-end: var(--size-3);
}
.content-wrapper {
  overflow: hidden;
  height: v-bind(contentHeight);

  &.animated {
    transition: height 0.2s;
  }
}

.content {
  padding: var(--size-2);
  &.has-offset {
    padding-inline-start: var(--size-8);
  }
}

.toggle {
  display: flex;
  align-items: flex-end;
  gap: var(--size-3);
  text-align: left;
  background: transparent;
  width: 100%;
  border: none;
  padding: var(--size-2);
  color: var(--text-1);
  border-radius: var(--radius-2);
  font-size: var(--font-size-2);
  font-weight: var(--font-weight-5);

  &:hover:not(:disabled) {
    background-color: hsl(var(--primary-hsl) / 0.08);
  }
  &:focus {
    background-color: hsl(var(--primary-hsl) / 0.12);
  }
}

.left-icon {
  font-size: var(--font-size-4);
  flex-shrink: 0;
}
.toggle-icon {
  margin-inline-start: auto;
  transition: transform 0.2s ease;

  @media (----md-n-below) {
    font-size: var(--font-size-5);
  }

  &.is-opened {
    transform: rotateZ(0.5turn);
  }
}
</style>
