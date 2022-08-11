import { SimpleStore } from "../types/Store.js";
import { produce } from "immer";
import _ from "lodash";
import { useSyncExternalStore } from "use-sync-external-store/shim";

export function createSimpleStore<T extends object>(initState: T): SimpleStore<T> {
  const ee = createSimpleEmitter();
  let currState = initState;

  return {
    get() {
      return currState;
    },
    mutate(fn) {
      const nextState = produce(currState, fn as any);

      const doModify = (final: any) => {
        const didChange = currState !== final;

        if (didChange) {
          currState = final;
          ee.emit(currState);
        }

        return didChange;
      };

      if (nextState instanceof Promise) {
        return nextState.then((v) => doModify(v)) as any;
      } else {
        return doModify(nextState) as any;
      }
    },
    set(newState) {
      currState = newState;
      ee.emit(currState);
    },
    setPath(path, newVal, secret?: { silent?: true }) {
      currState = produce(currState, (draft: any) => {
        _.set(draft, path, newVal);
      });

      //We need a secret silent flag for lazily setting the store to the form default value the first time the value is rendered
      if (!secret?.silent) {
        ee.emit(currState);
      }
    },
    subscribe(fn) {
      return ee.onChange(fn);
    },
    updateDeep(changes) {
      currState = produce(currState, (draft: any) => {
        _.merge(draft, changes);
      });
      ee.emit(currState);
    },
    updateShallow(changes) {
      currState = produce(currState, (draft: any) => {
        Object.assign(draft, changes);
      });
      ee.emit(currState);
    },
    useStoreValue(selector) {
      return useSyncExternalStore(ee.onChange, () => (selector ? selector(currState) : currState)) as any;
    },
  };
}

type Unsubscribe = () => void;
function createSimpleEmitter() {
  const listeners = new Map<Function, Function>();

  return {
    emit(newVal: any) {
      listeners.forEach((fn) => {
        fn(newVal);
      });
    },
    onChange(fn: (newVal: any) => any): Unsubscribe {
      listeners.set(fn, fn);
      return () => {
        listeners.delete(fn);
      };
    },
  };
}
