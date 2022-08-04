import { SWRConfiguration, SWRResponse } from "swr";
import { SWRInfiniteConfiguration, SWRInfiniteResponse } from "swr/infinite";
import { AsyncFn, DeepAsyncFnRecord } from "create-typed-sdk";

export type TypedSDKWithReactOptions<T extends DeepAsyncFnRecord<T>> = {
  [key in keyof T]: T[key] extends AsyncFn
    ? (arg: Parameters<T[key]>[0], opts?: { revalidate?: QueryKey[] }) => ReturnType<T[key]>
    : T[key] extends DeepAsyncFnRecord<T[key]>
    ? TypedSDKWithReactOptions<T[key]>
    : never;
};

export type QueryKey = { path: string[]; arg?: any };

export type TypedGetSDKQueryKey<T extends DeepAsyncFnRecord<T>> = {
  [key in keyof T]: T[key] extends AsyncFn
    ? (arg?: Parameters<T[key]>[0]) => QueryKey
    : T[key] extends DeepAsyncFnRecord<T[key]>
    ? () => QueryKey & TypedGetSDKQueryKey<T[key]>
    : never;
};

export type TypedUseEndpoint<T extends DeepAsyncFnRecord<T>> = {
  [key in keyof T]: T[key] extends AsyncFn
    ? <TQueryFnData = Awaited<ReturnType<T[key]>>, TError = unknown, TData = TQueryFnData>(
        argument: Parameters<T[key]>[0],
        options?: SWRConfiguration<TQueryFnData, TError> & { enabled?: boolean },
      ) => SWRResponse<TData, TError>
    : T[key] extends DeepAsyncFnRecord<T[key]>
    ? TypedUseEndpoint<T[key]>
    : never;
};

export type TypedUseInfiniteEndpoint<T extends DeepAsyncFnRecord<T>> = {
  [key in keyof T]: T[key] extends AsyncFn
    ? <TQueryFnData = Awaited<ReturnType<T[key]>>, TError = unknown>(
        getArgument: (page: number, previousPageData?: null | TQueryFnData) => Parameters<T[key]>[0],
        options?: SWRInfiniteConfiguration<TQueryFnData, TError> & { enabled?: boolean },
      ) => SWRInfiniteResponse<TQueryFnData, TError>
    : T[key] extends DeepAsyncFnRecord<T[key]>
    ? TypedUseInfiniteEndpoint<T[key]>
    : never;
};
