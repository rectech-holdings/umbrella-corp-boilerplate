import { ExtractObjectPath, OptionalNullable } from "../utils/typescript-utils.js";
import { LeafRouteDef, RouteDef } from "./routes.js";
import { Simplify } from "type-fest";
import { $pathType, PathObjResult } from "./path.js";

const $params = Symbol("$params");
export type $paramsType = typeof $params;

//We have to use private symbol accessors so that we expose a small typescript surface area to the outside world
//but can still access the data we need within this file. A bit weird but likely the best approach for DX.
const validators = Symbol("validators");
const enumOptions = Symbol("enumOptions");
const defaultValue = Symbol("defaultValue");
const isRequired = Symbol("isRequired");

class ParamTypesClass<
  T extends PropertyKey,
  willBeRequired extends boolean = true,
  hasDefaultValue extends boolean = false,
> {
  [validators]: (((val: T) => string) | ((val: T) => Promise<string>))[] = [];
  [enumOptions]: T[] = [];
  [defaultValue]: undefined | T = undefined;
  [isRequired]: boolean = true;

  constructor(a?: { enumOptions?: T[] }) {
    this[enumOptions] = a?.enumOptions || [];
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

  addValidator(fn: ((val: T) => string) | ((val: T) => Promise<string>)) {
    this[validators].push(fn);
    return this;
  }
}

export const ParamTypes = {
  string() {
    return new ParamTypesClass<string>();
  },

  enum<F extends Record<PropertyKey, true>>(enumObj: F) {
    return new ParamTypesClass<keyof F>({ enumOptions: Object.keys(enumObj) as any });
  },

  number() {
    return new ParamTypesClass<number>();
  },
};

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

type InferParamsInput<T extends ParamsBase> = Simplify<
  OptionalNullable<{
    [prop in keyof T]: InferInputField<T[prop]>;
  }>
>;

type InferParamsOutput<T extends ParamsBase> = Simplify<
  OptionalNullable<{
    [prop in keyof T]: InferOutputField<T[prop]>;
  }>
>;

export type ParamsBase = Record<string, ParamTypesClass<any, any, any>>;

//Used when consuming params in code
export type ParamsOutputObj<T extends RouteDef, ParentParams extends ParamsBase = {}> = T extends LeafRouteDef
  ? { [$params]: InferParamsOutput<T["params"] & ParentParams> }
  : T extends { routes: any }
  ? {
      [key in keyof T["routes"]]: ParamsOutputObj<T["routes"][key], T["params"] & ParentParams>;
    } & { [$params]: InferParamsOutput<T["params"] & ParentParams> }
  : never;

//Used when generating urls
export type ParamsInputObj<T extends RouteDef, ParentParams extends ParamsBase = {}> = T extends LeafRouteDef
  ? { [$params]: InferParamsInput<T["params"] & ParentParams> }
  : T extends { routes: any }
  ? {
      [key in keyof T["routes"]]: ParamsInputObj<T["routes"][key], T["params"] & ParentParams>;
    } & { [$params]: InferParamsInput<T["params"] & ParentParams> }
  : never;

export type GetInputParamsFromPath<
  T extends RouteDef,
  F extends PathObjResult<any, any, any, any, any, any, any, any>,
> = ExtractObjectPath<ParamsInputObj<T>, F[$pathType]>[$paramsType];
