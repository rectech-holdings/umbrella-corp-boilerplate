import { Simplify } from "type-fest";
import {
  UseQueryOptions,
  UseQueryResult,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
} from "@tanstack/react-query";
import { AsyncFn, DeepAsyncFnRecord } from "create-typed-sdk";

export type TypedReactSDKInvokeOpts = { invalidate?: QueryKey[] };

export type TypedReactSDK<T extends DeepAsyncFnRecord<T>> = {
  [key in keyof T]: T[key] extends AsyncFn
    ? (arg: Parameters<T[key]>[0], opts?: TypedReactSDKInvokeOpts) => ReturnType<T[key]>
    : T[key] extends DeepAsyncFnRecord<T[key]>
    ? TypedReactSDK<T[key]>
    : never;
};

export type QueryKey = [...path: string[], arg: unknown] & {
  //Make QueryKey be a branded type to reduce chances of accidentally supplying an incorrect parameter
  __isQueryKey: true;
};

export type TypedGetSDKQueryKey<T extends DeepAsyncFnRecord<T>> = {
  [key in keyof T]: T[key] extends AsyncFn
    ? (arg?: Parameters<T[key]>[0]) => QueryKey
    : T[key] extends DeepAsyncFnRecord<T[key]>
    ? (() => QueryKey) & TypedGetSDKQueryKey<T[key]>
    : never;
};

type BaseUseQueryOptions<TData = unknown, TError = unknown> = Simplify<Omit<UseQueryOptions<TData, TError>, "context">>;

export type TypedUseSDK<T extends DeepAsyncFnRecord<T>> = {
  [key in keyof T]: T[key] extends AsyncFn
    ? <TQueryFnData = Awaited<ReturnType<T[key]>>, TError = unknown, TData = TQueryFnData>(
        argument: Parameters<T[key]>[0],
        options?: BaseUseQueryOptions<TData, TError>,
      ) => UseQueryResult<TData, TError>
    : T[key] extends DeepAsyncFnRecord<T[key]>
    ? TypedUseSDK<T[key]>
    : never;
};

export type TypedUsePaginatedSDK<T extends DeepAsyncFnRecord<T>> = {
  [key in keyof T]: T[key] extends AsyncFn
    ? <TQueryFnData = Awaited<ReturnType<T[key]>>, TError = unknown>(
        getParameters: (previousPage: TQueryFnData, pages: TQueryFnData[]) => Parameters<T[key]>[0],
        options?: BaseUseQueryOptions<TQueryFnData, TError>,
      ) => UseInfiniteQueryResult<TQueryFnData, TError>
    : T[key] extends DeepAsyncFnRecord<T[key]>
    ? TypedUsePaginatedSDK<T[key]>
    : never;
};
