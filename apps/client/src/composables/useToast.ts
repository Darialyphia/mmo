import type { PartialBy } from '@mmo/shared';
import { defineStore, storeToRefs } from 'pinia';
import type { RouteLocationRaw } from 'vue-router/auto';

export type ToastType = 'success' | 'info' | 'warning' | 'danger';
export type ToastPlacement = 'top' | 'bottom' | 'right' | 'left';
export type Toast = {
  id: string;
  title: string;
  text?: string;
  icon: string;
  type: ToastType;
  placement: ToastPlacement;
  timeout: number | false;
  link?: RouteLocationRaw;
};
export type ToastInput = Omit<PartialBy<Toast, 'timeout'>, 'id'>;
export type ToastHelperInput = PartialBy<ToastInput, 'icon' | 'type'>;

const DEFAULT_TIMEOUT = 5000;

export const useToastStore = defineStore('toast', () => {
  const api = {
    toasts: ref<Toast[]>([]),

    add(input: ToastInput) {
      const id = useNanoId();
      api.toasts.value.push({
        timeout: DEFAULT_TIMEOUT,
        id,
        ...input
      });

      if (input.timeout !== false) {
        setTimeout(() => {
          api.clear(id);
        }, input.timeout ?? DEFAULT_TIMEOUT);
      }
    },

    clear(id: string) {
      const idx = api.toasts.value.findIndex(t => t.id === id);
      if (idx === -1) return;

      api.toasts.value.splice(idx, 1);
    },

    clearAll() {
      api.toasts.value = [];
    }
  };

  return api;
});

export const useToast = () => {
  const toastStore = useToastStore();
  const { toasts } = storeToRefs(toastStore);

  const addToastHelper =
    (type: ToastType, icon: string) => (toast: ToastHelperInput) => {
      toastStore.add({
        type,
        icon,
        ...toast
      });
    };

  return {
    toasts,
    clear: toastStore.clear,
    clearAll: toastStore.clearAll,
    show: toastStore.add,
    showDanger: addToastHelper('danger', 'icon-park-solid:error'),
    showWarning: addToastHelper('warning', 'ic:baseline-warning'),
    showSuccess: addToastHelper('success', 'ic:outline-check'),
    showInfo: addToastHelper('info', 'ion:information-sharp')
  };
};
