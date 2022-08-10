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

type Mode = "onChange" | "onBlur" | "onValidate" | "onTouched" | "all";
type ReValidateMode = "onChange" | "onBlur" | "onValidate";

type NativeFormControlProps<Attr, Elem> = Omit<
  DetailedHTMLProps<Attr, Elem>,
  | "value"
  | "defaultValue"
  | "defaultChecked"
  | "required"
  | "pattern"
  | "min"
  | "max"
  | "minLength"
  | "maxLength"
  | "options"
>;

export type BaseFormControlProps<State extends object, Value> = {
  field: (s: State) => Value;
  defaultValue?: Value;
  mode?: Mode;
  reValidateMode?: ReValidateMode;
  //Validators
  validate?: (currVal: Value) => null | undefined | false | "" | string | string[];
  required?: true | string;
  isEmail?: true | string;
  isUrl?: true | string;
  pattern?: RegExp | [RegExp, string];
  minLength?: number | [number, string];
  maxLength?: number | [number, string];
  max?: number | [number, string];
  min?: number | [number, string];
};

export type InputProps<ExtraProps extends object, State extends object> = Simplify<
  {
    opts: ExtraProps & BaseFormControlProps<State, string>;
  } & NativeFormControlProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>
>;

export type SelectProps<ExtraProps extends object, State extends object, Value> = Simplify<
  {
    opts: ExtraProps & BaseFormControlProps<State, Value> & AdditionalPropsForDevSuppliedSelect<Value>;
  } & NativeFormControlProps<InputHTMLAttributes<HTMLSelectElement>, HTMLSelectElement>
>;

export type AdditionalPropsForDevSuppliedBaseComponent<NativeElement> = {
  forwardedRef: ForwardedRef<NativeElement>;
  errors?: string[];
};

export type AdditionalPropsForDevSuppliedSelect<Value> =
  AdditionalPropsForDevSuppliedBaseComponent<HTMLSelectElement> & {
    options: { value: Value; key: string; label?: string }[];
  };

export type AdditionalPropsForDevSuppliedInput = AdditionalPropsForDevSuppliedBaseComponent<HTMLInputElement>;

export type DevSuppliedInputComponent<ExtraProps extends object> = (
  a: {
    native: DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;
  } & AdditionalPropsForDevSuppliedInput &
    ExtraProps,
) => JSX.Element;

export type DevSuppliedSelectComponent<ExtraProps extends object, Value> = (
  a: {
    native: DetailedHTMLProps<InputHTMLAttributes<HTMLSelectElement>, HTMLSelectElement>;
  } & AdditionalPropsForDevSuppliedSelect<Value> &
    ExtraProps,
) => JSX.Element;

export type CreateWhiteLabelFormOptions<ExtraProps extends object> = {
  type: "dom";
  components?: {
    Input?: DevSuppliedInputComponent<ExtraProps>;
    Select?: DevSuppliedSelectComponent<ExtraProps, unknown>;
  };
};

export type CreateWhitelabelFormReturnValue<ExtraProps extends object> = {
  useForm: UseForm<ExtraProps>;
};

export type UseFormOpts<State extends object> = {
  initState: State;
  mode?: Mode;
  reValidateMode?: ReValidateMode;
};

export type UseFormReturnValue<ExtraProps extends object, State extends object> = {
  store: Omit<FormStore<State>, "useStoreValue">;
  useStoreValue: FormStore<State>["useStoreValue"];
  Input: <T>(a: InputProps<ExtraProps, State>) => JSX.Element | null;
  Select: <T>(a: SelectProps<ExtraProps, State, T>) => JSX.Element | null;
};

export type UseForm<ExtraProps extends object> = <State extends object>(
  opts: UseFormOpts<State>,
) => UseFormReturnValue<ExtraProps, State>;
