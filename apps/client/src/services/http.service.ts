import { config } from '@/config';
import { ofetch, type FetchOptions } from 'ofetch';
import superjson from 'superjson';

const requestInterceptors = new Set<FetchOptions['onRequest']>();
const requestErrorInterceptors = new Set<FetchOptions['onRequestError']>();
const responseInterceptors = new Set<FetchOptions['onResponse']>();
const responseErrorInterceptors = new Set<FetchOptions['onResponseError']>();

type HttpOptions = Omit<FetchOptions<'json'>, 'method'>;

const ACCEPT_LANGUAGE_HEADER = 'Accept-Language';

export type HttpService = ReturnType<typeof createHttpService>;

export const createHttpService = ({ getLang }: { getLang: () => string }) => {
  const http = ofetch.create?.({
    retry: false,
    credentials: 'include',
    baseURL: config.API_URL,
    async onRequest(ctx) {
      if (!ctx.options.headers) {
        ctx.options.headers = new Headers();
      }

      const headers = ctx.options.headers as Headers;
      headers.set(ACCEPT_LANGUAGE_HEADER, getLang());

      for (const cb of requestInterceptors.values()) {
        await cb?.(ctx);
      }
    },
    async onRequestError(ctx) {
      for (const cb of requestErrorInterceptors.values()) {
        await cb?.(ctx);
      }
    },
    async onResponse(ctx) {
      for (const cb of responseInterceptors.values()) {
        await cb?.(ctx);
      }
    },
    async onResponseError(ctx) {
      for (const cb of responseErrorInterceptors.values()) {
        await cb?.(ctx);
      }
    }
  });

  const createHttpCaller =
    (method: 'GET' | 'POST' | 'PUT' | 'DELETE') =>
    async <T>(url: string, options: HttpOptions = {}) => {
      const result = await http<string>(url, { method, ...options });

      return superjson.parse<T>(result);
    };

  return {
    fetch: http,
    get: createHttpCaller('GET'),
    post: createHttpCaller('POST'),
    put: createHttpCaller('PUT'),
    delete: createHttpCaller('DELETE'),
    onRequest(listener: FetchOptions['onRequest']) {
      requestInterceptors.add(listener);
    },
    onRequestError(listener: FetchOptions['onRequestError']) {
      requestErrorInterceptors.add(listener);
    },
    onResponse(listener: FetchOptions['onResponse']) {
      responseInterceptors.add(listener);
    },
    onResponseError(listener: FetchOptions['onResponseError']) {
      responseErrorInterceptors.add(listener);
    }
  };
};
