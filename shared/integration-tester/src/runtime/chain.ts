export type ChainableFunction<T extends string, Args extends any[]> = {
  (...args: Args): void;
} & {
  [x in T]: ChainableFunction<T, Args>;
};

export function createChainable<T extends string, Args extends any[]>(
  keys: T[],
  fn: (this: Record<T, boolean | undefined>, ...args: Args) => void,
): ChainableFunction<T, Args> {
  function create(obj: Record<T, boolean | undefined>) {
    const chain = function (this: any, ...args: Args) {
      return fn.apply(obj, args);
    };
    for (const key of keys) {
      Object.defineProperty(chain, key, {
        get() {
          return create({ ...obj, [key]: true });
        },
      });
    }
    return chain;
  }

  const chain = create({} as any) as any;
  chain.fn = fn;
  return chain;
}
