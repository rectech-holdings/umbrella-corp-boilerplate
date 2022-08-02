import axios from "axios";

type BaseOpts = {
  namespace?: string;
  onFetch?: (a: { fetchProm: Promise<any> } & DoFetchArg) => any;
};

export type TypedSDKOptions = ({ url: string } & BaseOpts) | ({ doFetch: DoFetch } & BaseOpts);

export function createTypedSDK<T extends DeepAsyncFnRecord<any>>(opts: TypedSDKOptions): TypedSDK<T> {
  const doFetch: DoFetch =
    "doFetch" in opts
      ? opts.doFetch
      : (p) => axios.post(`${opts.url}/${p.path.join("/")}`, p.mainArg).then((resp) => resp.data);

  const getNextQuery = (path: string[]): any => {
    return new Proxy(
      () => {}, //use function as base, so that it can be called...
      {
        apply: (__, ___, args) => {
          const fetchArg = { mainArg: args[0], extraArgs: args.slice(1), path };

          const prom = doFetch(fetchArg);

          opts.onFetch?.({ fetchProm: prom, ...fetchArg });

          return prom;
        },
        get(__, prop) {
          return getNextQuery(path.concat(prop.toString()));
        },
      },
    );
  };

  return getNextQuery([]);
}

export function collectEndpoints<T extends DeepAsyncFnRecord<T>>(api: T) {
  function collectLeafFunctions(value: any, path = [] as string[]) {
    const fns = [];
    if (isPlainObject(value) || Array.isArray(value)) {
      Object.keys(value).forEach((key) => {
        fns.push(...collectLeafFunctions(value[key], path.concat(key)));
      });
    } else {
      if (typeof value === "function") {
        fns.push({
          path,
          fn: value,
        });
      }
    }
    return fns;
  }
  return collectLeafFunctions(api);
}

export function attachApiToAppWithDefault<T extends DeepAsyncFnRecord<T>>(
  api: T,
  app: {
    post: (
      path: string,
      handler: (req: { body: any }, resp: { send: (v: any) => any } | { json: (v: any) => any }) => void,
    ) => any;
  },
) {
  collectEndpoints(api).forEach(({ fn, path }) => {
    if (!app.post) {
      throw new Error("No post method found on app! Ensure you are using a nodejs library like express or fastify");
    }

    app.post("/" + path.join("/"), async (req, resp) => {
      if (!req.body) {
        throw new Error(
          "Unable to find post body! Ensure your server parses the request body and attaches it to the request",
        );
      }

      const val = await fn(...req.body.args);
      if ("send" in resp) {
        resp.send(val);
      } else if ("json" in resp) {
        resp.json(val);
      } else {
        throw new Error(
          "Unable to find method to send response! Ensure you are using a nodejs library like express or fastify",
        );
      }
    });
  });
}

type DoFetchArg = { path: string[]; mainArg: any; extraArgs?: any[] };
export type DoFetch = (p: DoFetchArg) => Promise<any>;

export type AsyncFn = (...args: any[]) => Promise<any>;

export type DeepAsyncFnRecord<T extends {}> = {
  [key in keyof T]: T[key] extends AsyncFn ? T[key] : DeepAsyncFnRecord<T[key]>;
};

export type TypedSDK<T extends DeepAsyncFnRecord<T>> = {
  [key in keyof T]: T[key] extends AsyncFn
    ? (argument: Parameters<T[key]>[0]) => ReturnType<T[key]>
    : T[key] extends DeepAsyncFnRecord<T[key]>
    ? TypedSDK<T[key]>
    : never;
};

function isPlainObject(value: unknown) {
  if (!value || typeof value !== "object") {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  if (proto === null && value !== Object.prototype) {
    return true;
  }
  if (proto && Object.getPrototypeOf(proto) === null) {
    return true;
  }
  return false;
}
