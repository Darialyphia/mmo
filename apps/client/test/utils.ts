// @ts-ignore FIXME how to get types from unplugin-vue -router ?
import { createRouter, createWebHistory } from 'vue-router/auto';
import { QueryClient } from '@tanstack/vue-query';
import { createI18n } from 'vue-i18n';
// import type { ApiClient } from '../src/utils/createApi';

export const getAppGlobals = (providers = {}) => {
  const router = createRouter({
    history: createWebHistory()
  });

  const i18n = createI18n({
    locale: 'fr',
    messages: {},
    silentFallbackWarn: false
  });

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: false
      }
    }
  });
  queryClient.mount();

  return {
    plugins: [router, i18n],
    provide: {
      VUE_QUERY_CLIENT: queryClient,
      ...providers
    }
  };
};
