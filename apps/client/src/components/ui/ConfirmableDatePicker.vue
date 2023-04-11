<script setup lang="ts">
import type { AnyObject, Nullable } from '@mmo/shared';
import {
  offset,
  shift,
  useFloating,
  autoUpdate,
  type Placement
} from '@floating-ui/vue';
import type { VNodeRef } from 'vue';
import { getFocusableChildren } from '@/utils/dom';

defineOptions({
  name: 'UiConfirmableDatePicker'
});

type Props = {
  modelValue?: Nullable<Date>;
  minValue?: Nullable<Date>;
  maxValue?: Nullable<Date>;
  time?: boolean;
  datetime?: boolean;
  range?: boolean;
  min?: Date;
  max?: Date;
  placement: Placement;
};

const props = withDefaults(defineProps<Props>(), {
  placement: 'top',
  modelValue: undefined,
  minValue: undefined,
  maxValue: undefined,
  min: undefined,
  max: undefined
});
const emit = defineEmits<{
  (e: 'update:modelValue', value: Date): void;
  (e: 'update:minValue', value: Date): void;
  (e: 'update:maxValue', value: Date): void;
}>();

const isOpened = ref(false);

const vModel = useVModel(props, 'modelValue', emit);
const minVModel = useVModel(props, 'minValue', emit);
const maxVModel = useVModel(props, 'maxValue', emit);

const internal = reactive({
  value: props.modelValue,
  minValue: props.minValue,
  maxValue: props.maxValue
});

const toggleEl = ref<Nullable<HTMLElement>>();
const floatingEl = ref<Nullable<HTMLElement>>();
const floatingId = useNanoId();
const toggleId = useNanoId();

const { x, y, strategy } = useFloating(toggleEl, floatingEl, {
  strategy: 'fixed',
  placement: props.placement,
  whileElementsMounted: autoUpdate,
  middleware: [offset(15), shift()]
});

const floatingStyle = computed(() => ({
  x: `${x.value ?? 0}px`,
  y: `${y.value ?? 0}px`,
  position: strategy.value
}));

const cancel = () => {
  Object.assign(internal, {
    value: props.modelValue,
    minValue: props.minValue,
    maxValue: props.maxValue
  });
  isOpened.value = false;
};

const confirm = () => {
  vModel.value = internal.value;
  minVModel.value = internal.minValue;
  maxVModel.value = internal.maxValue;
  isOpened.value = false;
};

const toggleSlotProps: { ref: VNodeRef; props: AnyObject } = useSlotProps({
  ref: el => {
    toggleEl.value = unrefElement(el as any);
  },
  props: {
    'aria-haspopup': true,
    'aria-controls': floatingId,
    'aria-expanded': isOpened,
    id: toggleId,
    onClick: () => {
      isOpened.value = !isOpened.value;
    }
  }
});

const { focused } = useFocusWithin(floatingEl);
const activeElement = useActiveElement();
watch([isOpened, focused], ([, focused], [prevIsOpened, prevFocused]) => {
  if (!prevIsOpened || !prevFocused) return;
  // @FIXME use focus trap ?
  if (activeElement.value === document.body) return;

  // const isToggleFocused = activeElement.value === toggleEl.value;
  if (!focused) {
    isOpened.value = false;
  }
});

watchEffect(() => {
  if (isOpened.value) {
    getFocusableChildren(unrefElement(floatingEl.value))?.[0]?.focus();
  }
});
onClickOutside(floatingEl, cancel, {
  ignore: [toggleEl]
});
onKeyStroke('Escape', cancel);
</script>

<template>
  <slot name="toggle" v-bind="toggleSlotProps" />
  <Transition>
    <UiSurface
      v-if="isOpened"
      :id="floatingId"
      ref="floatingEl"
      class="floating"
    >
      <UiDatePicker
        v-model="internal.value"
        v-model:min-value="internal.minValue"
        v-model:max-value="internal.maxValue"
        :time="props.time"
        :datetime="props.datetime"
        :range="props.range"
        :min="props.min"
        :max="props.max"
      />
      <footer>
        <UiButton left-icon="ic:round-close" @click="confirm">
          Appliquer
        </UiButton>
        <UiButton
          variant="outlined"
          left-icon="material-symbols:arrow-right-alt"
          @click="cancel"
        >
          Annuler
        </UiButton>
      </footer>
    </UiSurface>
  </Transition>
</template>

<style scoped lang="postcss">
@import '@/styles/medias.css';

.floating {
  position: v-bind('floatingStyle.position');
  left: v-bind('floatingStyle.x');
  top: v-bind('floatingStyle.y');
  z-index: 10;
  border: solid 1px var(--border-dimmed);
  box-shadow: var(--shadow-2);
  transform-origin: bottom center;

  @media (--md-n-below) {
    left: 0;
  }

  .ui-datepicker {
    border: none;
  }
}

footer {
  display: flex;
  gap: var(--size-3);
  flex-direction: row-reverse;
  background-color: var(--surface-1);

  @media (--md-n-below) {
    justify-content: space-between;
  }
}

.v-enter-active,
.v-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
  transform: translateY(var(--size-5)) scale(0);
}
</style>
