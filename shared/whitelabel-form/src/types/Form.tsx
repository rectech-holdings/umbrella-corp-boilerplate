import {
  DetailedHTMLProps,
  ForwardedRef,
  forwardRef,
  InputHTMLAttributes,
  ReactNode,
  RefCallback,
  RefObject,
  useState,
} from "react";
import { Simplify } from "type-fest";
import { createFormStore } from "../implementations/Store.js";
import { FormStore } from "./Store.js";

export type ValidateMode = "onChange" | "onBlur" | "onValidate" | "onTouched" | "all";
export type ReValidateMode = "onChange" | "onBlur" | "onValidate";

// type NativeFormControlProps<Attr, Elem> = Omit<
//   DetailedHTMLProps<Attr, Elem>,
//   | "value"
//   | "defaultValue"
//   | "defaultChecked"
//   | "required"
//   | "pattern"
//   | "min"
//   | "max"
//   | "minLength"
//   | "maxLength"
//   | "options"
// >;

// export type BaseFormControlProps<State extends object, Value> = {
//   field: (s: State) => Value;
//   defaultValue?: Value;
//   mode?: Mode;
//   reValidateMode?: ReValidateMode;
//   //Validators
//   validate?: (currVal: Value) => null | undefined | false | "" | string | string[];
//   required?: true | string;
//   isEmail?: true | string;
//   isUrl?: true | string;
//   pattern?: RegExp | [RegExp, string];
//   minLength?: number | [number, string];
//   maxLength?: number | [number, string];
//   max?: number | [number, string];
//   min?: number | [number, string];
// };

// export type InputProps<ExtraProps extends object, State extends object> = Simplify<
//   {
//     opts: ExtraProps & BaseFormControlProps<State, string>;
//   } & NativeFormControlProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>
// >;

// export type SelectProps<ExtraProps extends object, State extends object, Value> = Simplify<
//   {
//     opts: ExtraProps & BaseFormControlProps<State, Value> & AdditionalPropsForDevSuppliedSelect<Value>;
//   } & NativeFormControlProps<InputHTMLAttributes<HTMLSelectElement>, HTMLSelectElement>
// >;

// export type AdditionalPropsForDevSuppliedBaseComponent<NativeElement> = {
//   forwardedRef: ForwardedRef<NativeElement>;
//   errors?: string[];
// };

// export type AdditionalPropsForDevSuppliedSelect<Value> =
//   AdditionalPropsForDevSuppliedBaseComponent<HTMLSelectElement> & {
//     options: { value: Value; key: string; label?: string }[];
//   };

// export type AdditionalPropsForDevSuppliedInput = AdditionalPropsForDevSuppliedBaseComponent<HTMLInputElement>;

// export type DevSuppliedInputComponent<ExtraProps extends object> = (
//   a: {
//     native: DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;
//   } & AdditionalPropsForDevSuppliedInput &
//     ExtraProps,
// ) => JSX.Element;

// export type DevSuppliedSelectComponent<ExtraProps extends object, Value> = (
//   a: {
//     native: DetailedHTMLProps<InputHTMLAttributes<HTMLSelectElement>, HTMLSelectElement>;
//   } & AdditionalPropsForDevSuppliedSelect<Value> &
//     ExtraProps,
// ) => JSX.Element;

// export type CreateWhiteLabelFormOptions<ExtraProps extends object> = {
//   type: "dom";
//   components?: {
//     Input?: DevSuppliedInputComponent<ExtraProps>;
//     Select?: DevSuppliedSelectComponent<ExtraProps, unknown>;
//   };
// };

// export type CreateWhitelabelFormReturnValue<ExtraProps extends object> = {
//   useForm: UseForm<ExtraProps>;
// };

// export type UseFormReturnValue<ExtraProps extends object, State extends object> = {
//   store: Omit<FormStore<State>, "useStoreValue">;
//   useStoreValue: FormStore<State>["useStoreValue"];
//   Input: <T>(a: InputProps<ExtraProps, State>) => JSX.Element | null;
//   Select: <T>(a: SelectProps<ExtraProps, State, T>) => JSX.Element | null;
// };

// export type UseForm<ExtraProps extends object> = <State extends object>(
//   opts: UseFormOpts<State>,
// ) => UseFormReturnValue<ExtraProps, State>;

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
  a: ExtraProps & {
    errors: string[];
    onFocus: () => void;
    onBlur: () => void;
    value: Value;
    onChangeValue: (newVal: Value) => void;
  },
) => JSX.Element | null;

export type BaseWhiteLabelComponentProps<ExtraProps extends object, State extends object, Value> = ExtraProps & {
  field: (s: State) => Value;
  defaultValue?: Value;
  mode?: ValidateMode;
  reValidateMode?: ReValidateMode;
  validate?: (currVal: Value) => null | undefined | false | "" | string | string[];
  required?: true | string;
  max?: Value | [Value, string];
  min?: Value | [Value, string];
};

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
  a: WhitelabelComponentProps<ExtraProps & OptionsType<Value, ExtraOptionProps>, State, Value>,
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
