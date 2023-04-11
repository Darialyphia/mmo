import { isNumber, type Nullable } from '@mmo/shared';
import { nanoid } from 'nanoid';
import type { InjectionKey, Ref } from 'vue';

export type AccordionOpenedIndex = Nullable<number> | number[];
export type AccordionContext = {
  openedIndex: Ref<AccordionOpenedIndex>;
  open: (index: number) => void;
  close: (index: number) => void;
  toggle: (index: number) => void;
  isOpened: (index: number) => boolean;
  register: () => number;
};

export const ACCORDION_INJECTION_KEY = Symbol(
  'accordion'
) as InjectionKey<AccordionContext>;

export const useAccordionProvider = (
  openedIndex: Ref<AccordionOpenedIndex>
) => {
  const items = ref<string[]>([]);

  const accordion: AccordionContext = {
    openedIndex,
    isOpened(index: number) {
      if (!isDefined(openedIndex.value)) return false;
      if (isNumber(openedIndex.value)) {
        return openedIndex.value === index;
      }
      return openedIndex.value.includes(index);
    },
    open(index: number) {
      if (!isDefined(openedIndex.value) || isNumber(openedIndex.value)) {
        openedIndex.value = index;
        return;
      }

      if (openedIndex.value.includes(index)) return;
      openedIndex.value.push(index);
    },
    close(index: number) {
      if (!isDefined(openedIndex.value) || isNumber(openedIndex.value)) {
        openedIndex.value = null;
        return;
      }

      if (!openedIndex.value.includes(index)) return;
      openedIndex.value.splice(openedIndex.value.indexOf(index), 1);
    },
    toggle(index: number) {
      accordion.isOpened(index)
        ? accordion.close(index)
        : accordion.open(index);
    },
    register() {
      const id = nanoid();
      items.value.push(id);
      return items.value.indexOf(id);
    }
  };
  provide(ACCORDION_INJECTION_KEY, accordion);
};

export const useAccordion = () => useSafeInject(ACCORDION_INJECTION_KEY);
