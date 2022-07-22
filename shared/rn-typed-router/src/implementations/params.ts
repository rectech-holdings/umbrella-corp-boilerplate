import { ExtractObjectPath, OptionalNullable } from "../utils/typescript-utils.js";
import { LeafRouteDefWithoutUI, RouteDefWithoutUI } from "../types/routes.js";
import { Simplify } from "type-fest";
import { $pathType, PathObjResultBase } from "../types/path.js";

export const $params = Symbol("$params");
export type $paramsType = typeof $params;

//We have to use private symbol accessors so that we expose a small typescript surface area to the outside world
//but can still access the data we need within this file. A bit weird but likely the best approach for DX.
const type = Symbol("type");
const validators = Symbol("validators");
const enumOptions = Symbol("enumOptions");
const defaultValue = Symbol("defaultValue");
const isRequired = Symbol("isRequired");

export class ParamTypesClass<
  T extends PropertyKey,
  willBeRequired extends boolean = true,
  hasDefaultValue extends boolean = false,
> {
  [type]: "string" | "number" | "enum";
  [validators]: ((val: T) => string)[] = [];
  [enumOptions]: T[] = [];
  [defaultValue]: undefined | T = undefined;
  [isRequired]: boolean = true;

  constructor(a: { type: "string" } | { type: "number" } | { type: "enum"; enumOptions?: T[] }) {
    this[type] = a.type;
    if (a.type === "enum") {
      this[enumOptions] = a?.enumOptions || [];
    }
  }

  optional() {
    this[isRequired] = false;
    return this as any as ParamTypesClass<T, false, hasDefaultValue>;
  }

  default(val: T) {
    this[defaultValue] = val;
    this[isRequired] = false;
    return this as any as ParamTypesClass<T, false, true>;
  }

  addValidator(fn: (val: T) => string) {
    this[validators].push(fn);
    return this;
  }
}

export const ParamTypes = {
  string() {
    return new ParamTypesClass<string>({ type: "string" });
  },

  enum<F extends Record<PropertyKey, true>>(enumObj: F) {
    return new ParamTypesClass<keyof F>({ type: "enum", enumOptions: Object.keys(enumObj) as any });
  },

  number() {
    return new ParamTypesClass<number>({ type: "number" });
  },
};

function validateAndCleanParams(
  params: Record<string, any>,
  paramTypes: Record<string, ParamTypesClass<any, any, any>>,
  validateType: "input" | "output",
): { isValid: false; errors: string[] } | { isValid: true; params: Record<string, any> } {
  const errors: string[] = [];
  const finalParams = {};
  Object.keys(paramTypes).forEach((k) => {
    const typeVal = paramTypes[k]!;
    const tp = typeVal[type];
    const vldrs = typeVal[validators];
    const eOpts = typeVal[enumOptions];
    const dft = typeVal[defaultValue];
    const isReq = typeVal[isRequired];

    const val = validateType === "output" ? params[k] : params[k] ?? dft;

    const matchesType = tp === "enum" ? !!eOpts.find((a) => a === val) : typeof val === tp;

    if (isReq && !matchesType) {
      errors.push(`Required param "${k}" not found.`);
    }

    if (!matchesType && !errors.length) {
      errors.push(`Value "${val}" for param ${k} is not of type "${eOpts ? eOpts.join(",") : tp}"`);
    }

    if (val && vldrs.length) {
      vldrs.forEach((fn) => {
        const errorMsg = fn(val);
        if (errorMsg) {
          errors.push(errorMsg);
        }
      });
    }

    if (!errors.length && matchesType) {
      Object.assign(finalParams, { [k]: val });
    }
  });

  return errors.length ? { isValid: false, errors } : { isValid: true, params: finalParams };
}

export function validateAndCleanInputParams(
  inputParams: Record<string, any>,
  paramTypes: Record<string, ParamTypesClass<any, any, any>>,
): { isValid: false; errors: string[] } | { isValid: true; params: Record<string, any> } {
  return validateAndCleanParams(inputParams, paramTypes, "input");
}

export function validateAndCleanOutputParams(
  inputParams: Record<string, any>,
  paramTypes: Record<string, ParamTypesClass<any, any, any>>,
): { isValid: false; errors: string[] } | { isValid: true; params: Record<string, any> } {
  return validateAndCleanParams(inputParams, paramTypes, "output");
}

type InferType<T> = T extends ParamTypesClass<infer U, any, any> ? U : never;
type InferIsRequired<T> = T extends ParamTypesClass<any, infer U, any> ? U : never;
type InferHasDefaultValue<T> = T extends ParamTypesClass<any, any, infer U> ? U : never;

type InferInputField<T extends ParamTypesClass<any, any, any>> = InferIsRequired<T> extends true
  ? InferType<T>
  : InferType<T> | undefined;

type InferOutputField<T extends ParamTypesClass<any, any, any>> = InferIsRequired<T> extends false
  ? InferHasDefaultValue<T> extends false
    ? InferType<T> | undefined
    : InferType<T>
  : InferType<T>;

export type InferParamsInput<T extends ParamsTypeRecord> = Simplify<
  OptionalNullable<{
    [prop in keyof T]: InferInputField<T[prop]>;
  }>
>;

export type InferParamsOutput<T extends ParamsTypeRecord> = Simplify<
  OptionalNullable<{
    [prop in keyof T]: InferOutputField<T[prop]>;
  }>
>;

export type ParamsTypeRecord = Record<string, ParamTypesClass<any, any, any>>;

//Used when consuming params in code
export type ParamsOutputObj<
  T extends RouteDefWithoutUI,
  ParentParams extends ParamsTypeRecord = {},
> = T extends LeafRouteDefWithoutUI
  ? { [$params]: InferParamsOutput<T["params"] & ParentParams> }
  : T extends { routes: any }
  ? {
      [key in keyof T["routes"]]: ParamsOutputObj<T["routes"][key], T["params"] & ParentParams>;
    } & { [$params]: InferParamsOutput<T["params"] & ParentParams> }
  : never;

//Used when generating urls
export type ParamsInputObj<
  T extends RouteDefWithoutUI,
  ParentParams extends ParamsTypeRecord = {},
> = T extends LeafRouteDefWithoutUI
  ? { [$params]: InferParamsInput<T["params"] & ParentParams> }
  : T extends { routes: any }
  ? {
      [key in keyof T["routes"]]: ParamsInputObj<T["routes"][key], T["params"] & ParentParams>;
    } & { [$params]: InferParamsInput<T["params"] & ParentParams> }
  : never;

export type GetInputParamsFromPath<
  T extends RouteDefWithoutUI,
  F extends PathObjResultBase<any, any, any, any, any, any, any, any>,
> = ExtractObjectPath<ParamsInputObj<T>, F[$pathType]>[$paramsType];
