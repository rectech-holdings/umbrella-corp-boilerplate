import useSWR, { mutate, SWRConfiguration, useSWRConfig } from "swr";
import useInfiniteSWR from "swr/infinite";
import { createTypedSDK, DeepAsyncFnRecord, DoFetch, TypedSDK, TypedSDKOptions } from "create-typed-sdk";
import {
  QueryKey,
  TypedGetSDKQueryKey,
  TypedSDKWithReactOptions,
  TypedUseInfiniteQuery,
  TypedUseQuery,
} from "./utils.js";

export function createTypedReactSDK<Endpoints extends DeepAsyncFnRecord<Endpoints>>(
  opts: TypedSDKOptions,
): ReactSDK<Endpoints> {
  return new ReactSDK(opts);
}

export type CreateReactSDKOptions = TypedSDKOptions & { swr?: SWRConfiguration; persistor?: {} };

export class ReactSDK<Endpoints extends DeepAsyncFnRecord<Endpoints>> {
  #namespace?: string;
  constructor(opts: CreateReactSDKOptions) {
    const { onFetch, ...restOpts } = opts;

    this.#namespace = restOpts.namespace;

    this.SDK = createTypedSDK({
      onFetch: async (a) => {
        await Promise.all([onFetch?.(a), mutate(this.#getQueryKeyFromArgs(a), a.fetchProm)]);
      },
      ...restOpts,
    });
  }

  SDK: TypedSDKWithReactOptions<Endpoints>;

  useEndpoint(): TypedUseQuery<Endpoints> {
    return this.#useEndpointProxy;
  }

  useInfiniteEndpoint(): TypedUseInfiniteQuery<Endpoints> {
    return this.#useInfiniteEndpointProxy;
  }

  getQueryKey: TypedGetSDKQueryKey<Endpoints> = (() => {
    const getNextGetSDKQueryKey = (path: string[]): any => {
      return new Proxy(() => {}, {
        apply: (__, ___, args) => {
          return this.#getQueryKeyFromArgs({ path, arg: args[0] });
        },
        get: (__, prop) => {
          return getNextGetSDKQueryKey(path.concat(prop.toString()));
        },
      });
    };

    return getNextGetSDKQueryKey([]);
  })();

  #getQueryKeyFromArgs(a: { path: string[]; arg?: unknown }): QueryKey {
    const val: QueryKey = { path: a.path };

    if (typeof a.arg !== "undefined") {
      val.arg = a.arg;
    }

    if (this.#namespace) {
      val.namespace = this.#namespace;
    }

    return val;
  }

  #useEndpointProxy = (() => {
    const getNextUseEndpoint = (p: { path: string[] }): any => {
      return new Proxy(() => {}, {
        apply: (__, ___, args) => {
          const doFetch: DoFetch = (this.SDK as any).__doFetch;

          const opts = args[1] || {};

          // eslint-disable-next-line react-hooks/rules-of-hooks
          return useSWR(
            opts.enabled === false ? null : this.#getQueryKeyFromArgs({ path: p.path, arg: args[0] }),
            () => doFetch({ path: p.path, arg: args[0] }),
            opts,
          );
        },
        get(__, prop) {
          return getNextUseEndpoint({
            path: p.path.concat(prop.toString()),
          });
        },
      });
    };

    return getNextUseEndpoint({ path: [] });
  })();

  #useInfiniteEndpointProxy = (() => {
    const getNextUseInfiniteEndpoint = (p: { path: string[] }): any => {
      return new Proxy(() => {}, {
        apply: (__, ___, args) => {
          const getMainArg = args[0] as any;

          const doFetch: DoFetch = (this.SDK as any).__doFetch;
          const opts = args[1] || {};

          // eslint-disable-next-line react-hooks/rules-of-hooks
          return useInfiniteSWR(
            //@ts-ignore
            opts.enabled === false
              ? null
              : (a, prevData) => this.#getQueryKeyFromArgs({ path: p.path, arg: getMainArg(a, prevData) }),
            //@ts-ignore
            ({ arg }) => doFetch({ path: p.path, arg }),
            opts,
          );
        },
        get(__, prop) {
          return getNextUseInfiniteEndpoint({
            path: p.path.concat(prop.toString()),
          });
        },
      });
    };

    return getNextUseInfiniteEndpoint({ path: [] });
  })();
}
