import { debounce } from 'lodash-es';

const useDebouncedRef = <T = unknown>(initialValue: T, delay: number) => {
  const state = ref(initialValue);
  const debouncedRef = customRef((track, trigger) => ({
    get() {
      track();
      return state.value;
    },
    set: debounce(value => {
      state.value = value;
      trigger();
    }, delay)
  }));
  return debouncedRef;
};

export default useDebouncedRef;
