import { SWRConfiguration, SWRResponse, MutatorOptions } from "swr";
import { SWRInfiniteConfiguration, SWRInfiniteResponse } from "swr/infinite";
import { AsyncFn, DeepAsyncFnRecord } from "create-typed-sdk";

export type TypedSDKWithMutateOptions<T extends DeepAsyncFnRecord<T>> = {
  [key in keyof T]: T[key] extends AsyncFn
    ? (arg: Parameters<T[key]>[0], opts?: MutatorOptions<ReturnType<T[key]>>) => ReturnType<T[key]>
    : T[key] extends DeepAsyncFnRecord<T[key]>
    ? TypedSDKWithMutateOptions<T[key]>
    : never;
};

export type TypedGetSDKQueryKey<T extends DeepAsyncFnRecord<T>> = {
  [key in keyof T]: T[key] extends AsyncFn
    ? Parameters<T[key]>[0] extends undefined
      ? () => { path: string[]; arg: any }
      : (arg: Parameters<T[key]>[0]) => { path: string[]; arg: any }
    : T[key] extends DeepAsyncFnRecord<T[key]>
    ? TypedGetSDKQueryKey<T[key]>
    : never;
};

export type TypedUseQuery<T extends DeepAsyncFnRecord<T>> = {
  [key in keyof T]: T[key] extends AsyncFn
    ? <TQueryFnData = Awaited<ReturnType<T[key]>>, TError = unknown, TData = TQueryFnData>(
        argument: Parameters<T[key]>[0],
        options?: SWRConfiguration<TQueryFnData, TError>,
      ) => SWRResponse<TData, TError>
    : T[key] extends DeepAsyncFnRecord<T[key]>
    ? TypedUseQuery<T[key]>
    : never;
};

export type TypedUseInfiniteQuery<T extends DeepAsyncFnRecord<T>> = {
  [key in keyof T]: T[key] extends AsyncFn
    ? <TQueryFnData = Awaited<ReturnType<T[key]>>, TError = unknown>(
        getArgument: (page: number, previousPageData?: null | TQueryFnData) => Parameters<T[key]>[0],
        options?: SWRInfiniteConfiguration<TQueryFnData, TError>,
      ) => SWRInfiniteResponse<TQueryFnData, TError>
    : T[key] extends DeepAsyncFnRecord<T[key]>
    ? TypedUseInfiniteQuery<T[key]>
    : never;
};

export function getQueryKey(a: { path: string[]; arg: unknown; namespace?: string }): {
  path: string[];
  arg: unknown;
  namespace?: string;
} {
  const val: any = { path: a.path, arg: a.arg };

  if (a.namespace) {
    val.namespace = a.namespace;
  }

  return val;
}
