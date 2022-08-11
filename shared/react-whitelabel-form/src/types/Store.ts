import { DeepPartial } from "../utils/utils.js";

type Unsubscribe = () => void;

export type SimpleStore<T extends object> = {
  //Getters
  get: () => T;
  subscribe: (subFn: (a: T) => void) => Unsubscribe;
  useStoreValue<S>(selector: (a: T) => S): S;
  //Setters
  set: (newState: T) => void;
  setPath: (path: string[], value: any) => void;
  updateDeep: (a: DeepPartial<T>) => void;
  updateShallow: (a: Partial<T>) => void;
  mutate(mutateFn: (currState: T) => void): boolean;
  mutate(mutateFn: (currState: T) => Promise<void>): Promise<boolean>;
};

export type FormStore<T extends object> = SimpleStore<T> & {
  //Form Specific
  validate: () => boolean;
  silentlyValidate: () => boolean;
  reset: (newState?: T) => void;
};
