//Generates a promise that ALSO has a `resolve` and `reject` property, to let the promise be resolved elsewhere
export function deferred<T = any>() {
  let resolve: (val: any) => void, reject: (val: Error) => void;

  const prom: any = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  prom.resolve = (val: any) => {
    prom.isResolved = true;
    prom.resolvedValue = val;
    resolve(val);
  };

  prom.reject = (val: any) => {
    prom.isRejected = true;
    prom.rejectedValue = val;
    reject(val);
  };

  Object.assign(prom, {
    isResolved: false,
    isRejected: false,
    resolvedValue: undefined,
    rejectedValue: undefined,
  });

  return prom as Deferred<T>;
}

export type Deferred<T> = Promise<T> & ExtraDeferredProps<T>;

type ExtraDeferredProps<T> = {
  resolve: (val?: T) => void;
  reject: (val?: any) => void;
  readonly isResolved: boolean;
  readonly isRejected: boolean;
  readonly resolvedValue: T | undefined;
  readonly rejectedValue: T | undefined;
};
