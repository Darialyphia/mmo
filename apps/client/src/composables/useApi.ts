import type { ApiClient } from '@/utils/createApi';
import type {
  AnyFunction,
  AnyObject,
  ApiError,
  AsyncReturnType,
  PaginatedResponse
} from '@mmo/shared';
import type {
  QueryFunctionContext,
  UseInfiniteQueryOptions,
  UseQueryOptions
} from '@tanstack/vue-query';
import type { VueMutationObserverOptions } from '@tanstack/vue-query/build/lib/useMutation';
import type { FetchError } from 'ofetch';
import type { InjectionKey, Ref } from 'vue';

type AnyPaginatedFunction = (...args: any[]) => Promise<PaginatedResponse>;
export type ApiQueryKey<T extends AnyObject> = [string] | [string, Ref<T>];

export const API_INJECTION_KEY = Symbol('api') as InjectionKey<ApiClient>;

export const useApi = () => useSafeInject(API_INJECTION_KEY);

export type ApiClientQueryOptions<T extends AnyFunction> = Omit<
  UseQueryOptions<
    AsyncReturnType<T>,
    FetchError<ApiError>,
    AsyncReturnType<T>,
    ApiQueryKey<Parameters<T>[0]>
  >,
  'queryKey' | 'queryFn'
>;
export const useApiQuery = <T extends AnyFunction>(
  key: ApiQueryKey<Parameters<T>[0]>,
  getMethod: (api: ApiClient) => T,
  options?: ApiClientQueryOptions<T>
) => {
  const api = useApi();

  return useQuery({
    ...options,
    queryKey: key,
    queryFn: ({
      queryKey,
      pageParam
    }: QueryFunctionContext<typeof key, number>) => {
      return getMethod(api)(unref(queryKey[1]));
    }
  });
};

export type ApiClientInfiniteQueryOptions<T extends AnyPaginatedFunction> =
  Pick<
    UseInfiniteQueryOptions<
      AsyncReturnType<T>,
      FetchError<ApiError>,
      AsyncReturnType<T>,
      ApiQueryKey<Omit<Parameters<T>[0], 'page'>>
    >,
    | 'cacheTime'
    | 'enabled'
    | 'networkMode'
    | 'initialData'
    | 'initialDataUpdatedAt'
    | 'keepPreviousData'
    | 'meta'
    | 'notifyOnChangeProps'
    | 'onError'
    | 'onSettled'
    | 'onSuccess'
    | 'placeholderData'
    | 'queryKeyHashFn'
    | 'refetchIntervalInBackground'
    | 'retryOnMount'
    | 'retryDelay'
    | 'suspense'
    | 'staleTime'
  >;
export const useApiInfiniteQuery = <T extends AnyPaginatedFunction>(
  key: ApiQueryKey<Omit<Parameters<T>[0], 'page'>>,
  getMethod: (api: ApiClient) => T,
  options?: ApiClientInfiniteQueryOptions<T>
) => {
  const api = useApi();

  return useInfiniteQuery({
    ...options,
    getNextPageParam: lastPage => lastPage.meta.nextPage,
    getPreviousPageParam: firstPage => firstPage.meta.previousPage,
    queryKey: key,
    queryFn: ({
      queryKey,
      pageParam
    }: QueryFunctionContext<typeof key, number>) => {
      return getMethod(api)({
        page: pageParam ?? 1,
        ...unref(queryKey[1])
      });
    }
  });
};

export type ApiClientMutationOptions<T extends AnyFunction> = Omit<
  VueMutationObserverOptions<
    AsyncReturnType<T>,
    FetchError<ApiError>,
    Parameters<T>[0],
    ApiQueryKey<AnyObject>
  >,
  'mutationFn' | 'mutationKey'
>;
export const useApiMutation = <T extends AnyFunction>(
  key: ApiQueryKey<AnyObject>,
  getMethod: (api: ApiClient) => T,
  options?: ApiClientMutationOptions<T>
) => {
  const api = useApi();

  return useMutation(key, getMethod(api), options);
};
