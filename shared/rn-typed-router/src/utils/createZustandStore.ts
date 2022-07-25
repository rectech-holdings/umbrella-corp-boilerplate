import immer, { Patch, enablePatches } from "immer";
enablePatches();
import _ from "lodash";
import zustand, { State, Subscribe, UseBoundStore, StoreApi } from "zustand";

//Don't love the Zustand top level API. This tightens it up a bit IMO
export type ZustandStore<T extends object> = {
  set: (newState: T) => void;
  get: () => T;
  subscribe: T extends State ? Subscribe<T> : never;
  useStore(): T;
  useStore<U>(selector: (s: T) => U): U;
  //Returns whether any change was made
  modifyImmutably(modifyFn: (currState: T) => void): boolean;
  modifyImmutably(modifyFn: (currState: T) => Promise<void>): Promise<boolean>;
};

export function createZustandStore<StoreState extends object>(initState: StoreState): ZustandStore<StoreState> {
  const useStore = zustand(() => initState as any);

  const store: ZustandStore<StoreState> = {
    useStore: useStore as any,
    get: () => useStore.getState(),
    set: (a) => useStore.setState(a, true),
    subscribe: ((a: any) => useStore.subscribe(a)) as any,
    modifyImmutably: (modifyFn) => {
      const patches: Patch[] = [];
      const nextStateRaw = immer(useStore.getState(), modifyFn as any, (ptc) => {
        patches.push(...ptc);
      });

      const nextState: Promise<StoreState> | StoreState = nextStateRaw as any;

      if (nextState instanceof Promise) {
        return nextState.then((newVal) => {
          if (patches.length) {
            useStore.setState(newVal);
          }

          return !!patches.length;
        }) as any;
      } else {
        if (patches.length) {
          useStore.setState(nextState);
        }
        return !!patches.length;
      }
    },
  };

  return store;
}
