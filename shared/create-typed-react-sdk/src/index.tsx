import useSWR, { mutate, SWRConfiguration, SWRConfig, useSWRConfig } from "swr";
import useInfiniteSWR from "swr/infinite";
import { createTypedSDK, DeepAsyncFnRecord, DoFetch, TypedSDK, TypedSDKOptions } from "create-typed-sdk";
import {
  QueryKey,
  TypedGetSDKQueryKey,
  TypedSDKWithReactOptions,
  TypedUseInfiniteEndpoint,
  TypedUseEndpoint,
} from "./utils.js";
import React, { ReactNode, useContext } from "react";

export type TypedReactSDKOptions<Namespace extends string> = TypedSDKOptions & {
  namespace: Namespace;
};

export function createTypedReactSDK<Endpoints extends DeepAsyncFnRecord<Endpoints>, Namespace extends string = "">(
  opts: TypedReactSDKOptions<Namespace>,
): ReactSDK<Endpoints, Namespace> {
  return new ReactSDKInner(opts) as any as ReactSDK<Endpoints, Namespace>;
}

export type CreateReactSDKOptions<Namespace extends string> = TypedReactSDKOptions<Namespace> & {
  swr?: SWRConfiguration;
  persistor?: {};
};

type ReactSDKBase<Endpoints extends DeepAsyncFnRecord<Endpoints>> = {
  SDK: TypedSDK<Endpoints>;
  SDKProvider: React.FC<{ children: ReactNode }>;
  useEndpoint: TypedUseEndpoint<Endpoints>;
  useInfiniteEndpoint: TypedUseInfiniteEndpoint<Endpoints>;
};

export type ReactSDK<Endpoints extends DeepAsyncFnRecord<Endpoints>, Namespace extends string = ""> = {
  [K in keyof ReactSDKBase<Endpoints> as K extends "useEndpoint"
    ? `use${Capitalize<Namespace>}Endpoint`
    : K extends "useInfiniteEndpoint"
    ? `use${Capitalize<Namespace>}InfiniteEndpoint`
    : K extends "SDK"
    ? `${Capitalize<Namespace>}SDK`
    : K extends "SDKProvider"
    ? `${Capitalize<Namespace>}SDKProvider`
    : never]: ReactSDKBase<Endpoints>[K];
};

class ReactSDKInner<Endpoints extends DeepAsyncFnRecord<Endpoints>, Namespace extends string = ""> {
  constructor(opts: CreateReactSDKOptions<Namespace>) {
    const { onFetch, swr, persistor, ...restOpts } = opts;
    this.#swrOptions = swr;

    this.#SDK = createTypedSDK({
      onFetch: async (a) => {
        await Promise.all([onFetch?.(a), mutate(this.#getQueryKeyFromArgs(a), a.fetchProm)]);
      },
      ...restOpts,
    });

    //@ts-ignore
    this[`${capitalize(opts.namespace)}SDK`] = this.#SDK;

    //@ts-ignore
    this[`${capitalize(opts.namespace)}SDKProvider`] = this.#TypedReactSDKProvider;

    //@ts-ignore
    this[`use${capitalize(opts.namespace)}Endpoint`] = this.#useEndpoint;

    //@ts-ignore
    this[`use${capitalize(opts.namespace)}InfiniteEndpoint`] = this.#useInfiniteEndpoint;
  }

  #swrOptions?: SWRConfiguration;
  #SDKContextGuard = React.createContext<any>(null);
  #SDKContextGuardValue = Symbol("SDK-Instance");

  #useSDKCache = () => {
    const val = useContext(this.#SDKContextGuard);
    if (val !== this.#SDKContextGuardValue) {
      throw new Error("TypedReactSDKProvider is not provided at the root of your App! Wrap your app with it");
    }
    const { cache } = useSWRConfig();

    return cache;
  };

  #TypedReactSDKProvider = (a: { children: ReactNode }) => {
    const Provider = this.#SDKContextGuard.Provider;
    return (
      <Provider value={this.#SDKContextGuardValue}>
        <SWRConfig
          value={{
            ...(this.#swrOptions || {}),
            provider: () => new Map(),
          }}
        >
          {a.children}
        </SWRConfig>
      </Provider>
    );
  };

  #SDK: TypedSDKWithReactOptions<Endpoints>;

  #useEndpoint(): TypedUseEndpoint<Endpoints> {
    return this.#useEndpointProxy;
  }

  #useInfiniteEndpoint(): TypedUseInfiniteEndpoint<Endpoints> {
    return this.#useInfiniteEndpointProxy;
  }

  #getQueryKey: TypedGetSDKQueryKey<Endpoints> = (() => {
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

    return val;
  }

  #useEndpointProxy = (() => {
    const getNextUseEndpoint = (p: { path: string[] }): any => {
      return new Proxy(() => {}, {
        apply: (__, ___, args) => {
          const doFetch: DoFetch = (this.#SDK as any).__doFetch;

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

          const doFetch: DoFetch = (this.#SDK as any).__doFetch;
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

function capitalize(str: string) {
  if (!str) {
    return str;
  }
  return str[0]!.toUpperCase() + str.slice(1);
}
