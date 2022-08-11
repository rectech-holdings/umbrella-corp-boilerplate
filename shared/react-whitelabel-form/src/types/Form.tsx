import { Simplify, Merge } from "type-fest";
import { FormStore } from "./Store.js";

type MergeAndSimplify<T, U> = Simplify<Merge<T, U>>;

export type ValidateMode = "onChange" | "onBlur" | "onValidate" | "onTouched" | "all";
export type ReValidateMode = "onChange" | "onBlur" | "onValidate";

export type CreateUseWhitelabelFormReturnValue<Components extends ComponentsMap, State extends object> = {
  [K in keyof Components]: Components[K] extends WhiteLabelComponentWrapper<any, any>
    ? WhitelabelComponent<Components[K]["__ExtraProps"], State, Components[K]["__Value"]>
    : Components[K] extends WhiteLabelComponentWithOptionsWrapper<any, any>
    ? WhitelabelComponentWithOptions<Components[K]["__ExtraProps"], State, Components[K]["__ExtraOptionProps"]>
    : never;
} & {
  store: Simplify<Omit<FormStore<State>, "useStoreValue">>;
  useStoreValue: FormStore<State>["useStoreValue"];
};

export type UseFormOpts<State extends object> = {
  initState: State;
  mode?: ValidateMode;
  reValidateMode?: ReValidateMode;
};

export type ComponentsMap = Record<
  string,
  WhiteLabelComponentWrapper<any, any> | WhiteLabelComponentWithOptionsWrapper<any, any>
>;

export type AuthorFacingWhitelabelComponent<ExtraProps extends object, Value> = (
  a: MergeAndSimplify<
    ExtraProps,
    {
      errors: string[];
      onFocus: () => void;
      onBlur: () => void;
      value: Value;
      onChangeValue: (newVal: Value) => void;
    }
  >,
) => JSX.Element | null;

export type BaseWhiteLabelComponentProps<ExtraProps extends object, State extends object, Value> = MergeAndSimplify<
  ExtraProps,
  {
    field: (s: State) => Value;
    defaultValue?: Value;
    mode?: ValidateMode;
    reValidateMode?: ReValidateMode;
    validate?: (currVal: Value) => null | undefined | false | "" | string | string[];
    required?: true | string;
    max?: Value | [Value, string];
    min?: Value | [Value, string];
  }
>;

export type StringWhiteLabelComponentProps = {
  isEmail?: true | string;
  isUrl?: true | string;
  pattern?: RegExp | [RegExp, string];
  minLength?: number | [number, string];
  maxLength?: number | [number, string];
};

export type WhitelabelComponentProps<ExtraProps extends object, State extends object, Value> = Value extends string
  ? BaseWhiteLabelComponentProps<ExtraProps, State, Value> & StringWhiteLabelComponentProps
  : BaseWhiteLabelComponentProps<ExtraProps, State, Value>;

export type WhitelabelComponent<ExtraProps extends object, State extends object, Value> = (
  a: WhitelabelComponentProps<ExtraProps, State, Value>,
) => JSX.Element | null;

export type WhitelabelComponentWithOptions<
  ExtraProps extends object,
  State extends object,
  ExtraOptionProps extends object,
> = <Value>(
  a: WhitelabelComponentProps<MergeAndSimplify<ExtraProps, OptionsType<Value, ExtraOptionProps>>, State, Value>,
) => JSX.Element | null;

export type WhiteLabelComponentWrapper<Value, ExtraProps extends object> = {
  __ExtraProps: ExtraProps;
  __Value: Value;
};

export type WhiteLabelComponentWithOptionsWrapper<ExtraProps extends object, ExtraOptionProps extends object = {}> = {
  __ExtraProps: ExtraProps;
  __ExtraOptionProps: ExtraOptionProps;
};

export type OptionsType<Value, ExtraOptionProps extends object> = { options: ({ value: Value } & ExtraOptionProps)[] };
