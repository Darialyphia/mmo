import { fileURLToPath, URL } from 'node:url';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import Vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import VueRouter from 'unplugin-vue-router/vite';
import { VueRouterAutoImports } from 'unplugin-vue-router';
import { VitePWA } from 'vite-plugin-pwa';
import Components from 'unplugin-vue-components/vite';
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite';
// @ts-ignore missing types in vue-macros
import VueMacros from 'unplugin-vue-macros/vite';

export default defineConfig(() => ({
  plugins: [
    // the vue router plugin needs to be before the vue plugin
    VueRouter({
      routesFolder: fileURLToPath(new URL('./src/pages', import.meta.url)),
      dts: './typed-router.d.ts'
    }),

    VueMacros({
      plugins: {
        vue: Vue()
      }
    }),

    VueI18nPlugin({
      include: [resolve(__dirname, './locales/**')]
    }),

    AutoImport({
      include: [/\.[tj]sx?$/, /\.vue$/, /\.vue\?vue/, /\.md$/],
      imports: [
        'vue',
        '@vueuse/core',
        'vee-validate',
        'vue-i18n',
        VueRouterAutoImports,
        {
          '@tanstack/vue-query': [
            'useQuery',
            'useMutation',
            'useInfiniteQuery',
            'useQueryClient'
          ]
        }
      ],
      dirs: ['./src/composables', './src/composables/**']
    }),

    // VitePWA({
    //   registerType: 'prompt',
    //   srcDir: 'src',
    //   filename: 'sw.ts',
    //   strategies: 'injectManifest',
    //   devOptions: {
    //     enabled: false,
    //     type: 'module'
    //   },
    //   manifest: {
    //     name: 'Claude mmo',
    //     short_name: 'Claude',
    //     description: 'Claude mmo application',
    //     theme_color: '#ffffff',
    //     icons: [
    //       {
    //         src: '/icon/icon-192x192.png',
    //         sizes: '192x192',
    //         type: 'image/png'
    //       },
    //       {
    //         src: '/icon/icon-512x512.png',
    //         sizes: '512x512',
    //         type: 'image/png'
    //       },
    //       {
    //         src: '/icon/icon-512x512.png',
    //         sizes: '512x512',
    //         type: 'image/png',
    //         purpose: 'any maskable'
    //       }
    //     ]
    //   }
    // }),

    Components({
      dts: true,
      directoryAsNamespace: true,
      extensions: ['vue']
    })
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },

  build: { sourcemap: true },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['test/setup.ts']
  }
}));
