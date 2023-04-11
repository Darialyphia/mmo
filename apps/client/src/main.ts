import '@/styles/global.css';
import { createApp } from 'vue';
import App from './App.vue';
import { createRouter, createWebHistory } from 'vue-router/auto';
import { createI18n } from 'vue-i18n';
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import messages from '@intlify/unplugin-vue-i18n/messages';
import { createApiClient } from './utils/createApi';
import { API_INJECTION_KEY } from './composables/useApi';
import { enableCache } from '@iconify/vue';
import { createPinia } from 'pinia';

enableCache('session');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: false
    }
  }
});

const main = async () => {
  const router = createRouter({
    history: createWebHistory()
  });
  const i18n = createI18n({
    locale: 'en',
    messages
  });
  const apiClient = createApiClient({
    getLang: () => i18n.global.locale
  });
  const pinia = createPinia();

  const app = createApp(App);

  app.provide(API_INJECTION_KEY, apiClient);
  app.use(router);
  app.use(i18n);
  app.use(pinia);
  app.use(VueQueryPlugin, { queryClient });

  try {
    // await apiClient.authService.init(router);
  } catch (err) {
    console.error(err);
  } finally {
    app.mount('#app');
  }
};

main();
