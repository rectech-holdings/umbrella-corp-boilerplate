import { Simplify } from "type-fest";
import {
  QueryObserverOptions,
  QueryClient,
  QueryClientProvider,
  QueryCache,
  Query,
  useInfiniteQuery,
  useQuery,
  DehydrateOptions,
  HydrateOptions,
} from "@tanstack/react-query";
import { createTypedSDK, DeepAsyncFnRecord, DoFetch, TypedSDK, TypedSDKOptions } from "create-typed-sdk";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import {
  Persister,
  persistQueryClient,
  PersistQueryClientOptions,
  PersistQueryClientProvider,
} from "@tanstack/react-query-persist-client";

import {
  QueryKey,
  TypedGetSDKQueryKey,
  TypedReactSDK,
  TypedReactSDKInvokeOpts,
  TypedUsePaginatedSDK,
  TypedUseSDK,
} from "./utils.js";
import React, { ReactNode, useContext, useState } from "react";

export type TypedReactSDKOptions = TypedSDKOptions;

export function createTypedReactSDK<SDK extends DeepAsyncFnRecord<SDK>>(opts: ReactSDKOptions): ReactSDK<SDK> {
  return new ReactSDKInner(opts) as any as ReactSDK<SDK>;
}

type BasePersister = {
  shouldPersist: (q: QueryKey) => boolean;
} & Pick<PersistQueryClientOptions, "buster" | "maxAge">;

export type PersisterOpts =
  | (({ type: "sync" } & Parameters<typeof createSyncStoragePersister>[0]) & BasePersister)
  | (({ type: "async" } & Parameters<typeof createAsyncStoragePersister>[0]) & BasePersister);

type RQOptions = Pick<
  QueryObserverOptions,
  | "cacheTime"
  | "isDataEqual"
  | "keepPreviousData"
  | "queryKeyHashFn"
  | "refetchInterval"
  | "refetchIntervalInBackground"
  | "refetchOnMount"
  | "refetchOnReconnect"
  | "refetchOnWindowFocus"
  | "networkMode"
  | "useErrorBoundary"
  | "structuralSharing"
  | "staleTime"
  | "retry"
  | "retryDelay"
  | "retryOnMount"
  | "suspense"
>;

export type ReactSDKOptions = Simplify<TypedSDKOptions & { persister?: PersisterOpts } & RQOptions>;

export type ReactSDK<SDK extends DeepAsyncFnRecord<SDK>> = {
  SDK: TypedReactSDK<SDK>;
  SDKProvider: React.FC<{ children: ReactNode }>;
  getQueryKey: TypedGetSDKQueryKey<SDK>;
  useSDK: () => TypedUseSDK<SDK>;
  /**
   * Lets you easily paginate on endpoints that have pagination parameters
   *
   * @example
   * //Backend...
   * function queryArticles(p: { someRandomParam: boolean; articlePage: number }) {
   *   //Do some query using `someRandomParam` and `articlePage`...

   *   const moreDataExists = true; // You have to determine this

   *   type ArticlesResponse = {
   *     articles: string[];
   *     nextArticlePage?: number;
   *   };

   *   const resp: ArticlesResponse = {
   *     articles: ["lorum", "ipsum"],
   *     nextArticlePage: moreDataExists ? p.articlePage + 1 : undefined,
   *   };

   *   return resp;
   * }

   * // //Frontend...
   * function App() {
   *   const { data, fetchNextPage } = usePaginatedSDK().articles.queryArticles(
   *     (previousPageResult) => ({
   *       someRandomParam: true,
   *       articlePage: previousPageResult.nextArticlePage || 0,
   *     }),
   *   );

   *   // Note that `data.pages` is an array of responses from each page.
   *
   */

  usePaginatedSDK: () => TypedUsePaginatedSDK<SDK>;
};

class ReactSDKInner<SDK extends DeepAsyncFnRecord<SDK>> {
  #persisterOpts?: PersisterOpts;
  #persister?: Persister;
  #queryClient: QueryClient;

  #BaseSDK: TypedSDK<SDK>;

  constructor(opts: ReactSDKOptions) {
    const { onError, onSettled, onSuccess } = opts;
    this.#queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          cacheTime: Infinity,
          staleTime: 1000 * 60 * 5, //5 minutes before stale
        },
      },
    });

    this.#BaseSDK = createTypedSDK(opts);

    if (opts.persister) {
      this.#persisterOpts = opts.persister;

      const { buster, maxAge, shouldPersist } = opts.persister;
      this.#persister =
        opts.persister.type === "sync"
          ? createSyncStoragePersister(opts.persister)
          : createAsyncStoragePersister(opts.persister);

      persistQueryClient({
        persister: this.#persister,
        queryClient: this.#queryClient,
        buster,
        dehydrateOptions: {
          dehydrateMutations: false,
          dehydrateQueries: true,
          shouldDehydrateQuery: (a) => {
            return shouldPersist(a.queryKey as any);
          },
        },

        maxAge,
      });
    }
  }

  public SDK: TypedReactSDK<SDK> = (() => {
    const getNext = (path: string[]): any => {
      return new Proxy(() => {}, {
        apply: (__, ___, args) => {
          return this.#invokeBaseSDK({ path, arg: args[0], type: "SDK", extraOpts: args[1] });
        },
        get: (__, prop) => {
          return getNext(path.concat(prop.toString()));
        },
      });
    };

    return getNext([]);
  })();

  #invokeBaseSDK(p: {
    path: string[];
    arg: any;
    type: "useSDK" | "usePaginatedSDK" | "SDK";
    extraOpts?: TypedReactSDKInvokeOpts;
  }) {
    let curr = this.#BaseSDK as any;
    for (let i = 0; i < p.path.length; i++) {
      const thisPath = p.path[i]!;
      curr = curr[thisPath];
    }

    let prom = curr(p.arg);

    if (p.type === "SDK") {
      if (this.#persisterOpts?.shouldPersist([...p.path, p.arg] as QueryKey)) {
        prom.then((newVal: unknown) => {
          this.#queryClient.setQueryData([...p.path, p.arg], newVal);
        });
      }

      if (p.extraOpts?.invalidate) {
        prom = prom.then(async (val: any) => {
          await Promise.all(
            p.extraOpts!.invalidate!.map(async (k) => {
              await this.#queryClient.invalidateQueries({ queryKey: k });
            }),
          );

          return val;
        });
      }
    }

    return prom;
  }

  #SDKQueryClientContext = React.createContext<undefined | QueryClient>(undefined);

  #useAssertProvider = () => {
    if (!useContext(this.#SDKQueryClientContext)) {
      throw new Error(`Unable to find provider! Ensure you have added SDKProvider to the root of your React app`);
    }
  };

  public SDKProvider = (a: { children: ReactNode }) => {
    const Provider = this.#persister ? PersistQueryClientProvider : QueryClientProvider;

    return (
      <Provider
        persistOptions={this.#persister ? { persister: this.#persister, ...this.#persisterOpts } : (undefined as any)}
        contextSharing={false}
        client={this.#queryClient}
        context={this.#SDKQueryClientContext as any}
      >
        {a.children}
      </Provider>
    );
  };

  public useSDK = () => {
    return this.#useSDKProxy;
  };

  public usePaginatedSDK = () => {
    return this.#usePaginatedSDKProxy;
  };

  public getQueryKey: TypedGetSDKQueryKey<SDK> = (() => {
    const getNextGetSDKQueryKey = (path: string[]): any => {
      return new Proxy(() => {}, {
        apply: (__, ___, args) => {
          return typeof args[0] === "undefined" ? path : [...path, args[0]];
        },
        get: (__, prop) => {
          return getNextGetSDKQueryKey(path.concat(prop.toString()));
        },
      });
    };

    return getNextGetSDKQueryKey([]);
  })();

  #useSDKProxy = (() => {
    const getNextUseSDK = (p: { path: string[] }): any => {
      return new Proxy(() => {}, {
        apply: (__, ___, args) => {
          this.#useAssertProvider();

          const opts = args[1] || {};

          // eslint-disable-next-line react-hooks/rules-of-hooks
          return useQuery(
            [...p.path, args[0]],
            () => this.#invokeBaseSDK({ path: p.path, arg: args[0], type: "useSDK" }),
            { ...opts, context: this.#SDKQueryClientContext },
          );
        },
        get(__, prop) {
          return getNextUseSDK({
            path: p.path.concat(prop.toString()),
          });
        },
      });
    };

    return getNextUseSDK({ path: [] });
  })();

  #usePaginatedSDKProxy = (() => {
    const getNextUsePaginatedSDK = (p: { path: string[] }): any => {
      return new Proxy(() => {}, {
        apply: (__, ___, args) => {
          this.#useAssertProvider();

          const getArg = args[0] as any;
          const opts = args[1] || {};

          // eslint-disable-next-line react-hooks/rules-of-hooks
          const [initialArg] = useState(() => getArg(undefined, []));

          // eslint-disable-next-line react-hooks/rules-of-hooks
          return useInfiniteQuery(
            [...p.path, initialArg],
            //A bit weird to use the pageParam this way but :shrug:. No other good way to do it.
            ({ pageParam }) =>
              this.#invokeBaseSDK({ path: p.path, arg: pageParam || initialArg, type: "usePaginatedSDK" }),
            {
              ...opts,
              getNextPageParam: (prevPage, allPages) => getArg(prevPage, allPages),
              context: this.#SDKQueryClientContext,
            },
          );
        },
        get(__, prop) {
          return getNextUsePaginatedSDK({
            path: p.path.concat(prop.toString()),
          });
        },
      });
    };

    return getNextUsePaginatedSDK({ path: [] });
  })();
}

function capitalize(str: string) {
  if (!str) {
    return str;
  }
  return str[0]!.toUpperCase() + str.slice(1);
}
