import useSWR, { mutate } from "swr";
import useInfiniteSWR from "swr/infinite";
import { createTypedSDK, DeepAsyncFnRecord, DoFetch, TypedSDKOptions } from "create-typed-sdk";
import {
  getQueryKey,
  TypedGetSDKQueryKey,
  TypedSDKWithMutateOptions,
  TypedUseInfiniteQuery,
  TypedUseQuery,
} from "./utils.js";

export function createTypedReactSDK<Endpoints extends DeepAsyncFnRecord<Endpoints>>(
  opts: TypedSDKOptions,
): ReactSDK<Endpoints> {
  return new ReactSDK(opts);
}

export class ReactSDK<Endpoints extends DeepAsyncFnRecord<Endpoints>> {
  private namespace?: string;
  constructor(opts: TypedSDKOptions) {
    const { onFetch, ...restOpts } = opts;

    this.namespace = restOpts.namespace;

    this.SDK = createTypedSDK({
      onFetch: async (a) => {
        await Promise.all([onFetch?.(a), mutate(getQueryKey({ ...a, namespace: this.namespace }), a.fetchProm, a[1])]);
      },
      ...restOpts,
    });
  }

  public SDK: TypedSDKWithMutateOptions<Endpoints>;

  getQueryKey: TypedGetSDKQueryKey<Endpoints> = (() => {
    const getNextGetSDKQueryKey = (path: string[]): any => {
      return new Proxy(() => {}, {
        apply(__, ___, args) {
          return getQueryKey({ path, arg: args[0], namespace: this.namespace });
        },
        get(__, prop) {
          return getNextGetSDKQueryKey(path.concat(prop.toString()));
        },
      });
    };

    return getNextGetSDKQueryKey([]);
  })();

  private useEndpointProxy = (() => {
    const getNextUseEndpoint = (p: { path: string[] }): any => {
      return new Proxy(() => {}, {
        apply: (__, ___, args) => {
          const doFetch: DoFetch = (this.SDK as any).__doFetch;
          // eslint-disable-next-line react-hooks/rules-of-hooks
          return useSWR(
            getQueryKey({ path: p.path, arg: args[0], namespace: this.namespace }),
            () => doFetch({ path: p.path, arg: args[0] }),
            args[1],
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

  useEndpoint(): TypedUseQuery<Endpoints> {
    return this.useEndpointProxy;
  }

  private useInfiniteEndpointProxy = (() => {
    const getNextUseInfiniteEndpoint = (p: { path: string[] }): any => {
      return new Proxy(() => {}, {
        apply: (__, ___, args) => {
          const getMainArg = args[0] as any;

          const doFetch: DoFetch = (this.SDK as any).__doFetch;
          // eslint-disable-next-line react-hooks/rules-of-hooks
          return useInfiniteSWR(
            (a, prevData) => getQueryKey({ path: p.path, arg: getMainArg(a, prevData), namespace: this.namespace }),
            ({ arg }) => doFetch({ path: p.path, arg }),
            args[1],
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

  useInfiniteEndpoint(): TypedUseInfiniteQuery<Endpoints> {
    return this.useInfiniteEndpointProxy;
  }
}
