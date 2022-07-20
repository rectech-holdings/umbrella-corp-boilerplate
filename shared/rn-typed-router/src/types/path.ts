import { ExtractObjectPath, FilterNullable } from "../utils/typescript-utils.js";
import { RouteDef, LeafRouteDef, TabRouteDef, StackRouteDef } from "./routes.js";
import { Simplify } from "type-fest";
import { GetInputParamsFromPath } from "./params.js";

export type UrlString = string & { __isUrlString: true };

const $path = Symbol("$path");
const $routeDef = Symbol("$routeDef");

export type $pathType = typeof $path;
export type $routeDefType = typeof $routeDef;

export type PathObjResult<
  P1 extends string | null = null,
  P2 extends string | null = null,
  P3 extends string | null = null,
  P4 extends string | null = null,
  P5 extends string | null = null,
  P6 extends string | null = null,
  P7 extends string | null = null,
  P8 extends string | null = null,
> = Simplify<{ [$path]: FilterNullable<[P1, P2, P3, P4, P5, P6, P7, P8]> }>;

export type PathObjResultLeaf<
  P1 extends string | null = null,
  P2 extends string | null = null,
  P3 extends string | null = null,
  P4 extends string | null = null,
  P5 extends string | null = null,
  P6 extends string | null = null,
  P7 extends string | null = null,
  P8 extends string | null = null,
> = PathObjResult<P1, P2, P3, P4, P5, P6, P7, P8> & {
  [$routeDef]: "leaf";
};

export type PathObjResultTab<
  P1 extends string | null = null,
  P2 extends string | null = null,
  P3 extends string | null = null,
  P4 extends string | null = null,
  P5 extends string | null = null,
  P6 extends string | null = null,
  P7 extends string | null = null,
  P8 extends string | null = null,
> = PathObjResult<P1, P2, P3, P4, P5, P6, P7, P8> & {
  [$routeDef]: "tab";
};

export type PathObjResultStack<
  P1 extends string | null = null,
  P2 extends string | null = null,
  P3 extends string | null = null,
  P4 extends string | null = null,
  P5 extends string | null = null,
  P6 extends string | null = null,
  P7 extends string | null = null,
  P8 extends string | null = null,
> = PathObjResult<P1, P2, P3, P4, P5, P6, P7, P8> & {
  [$routeDef]: "stack";
};

export type PathObj<
  T extends RouteDef,
  P1 extends string | null = null,
  P2 extends string | null = null,
  P3 extends string | null = null,
  P4 extends string | null = null,
  P5 extends string | null = null,
  P6 extends string | null = null,
  P7 extends string | null = null,
  P8 extends string | null = null,
> = T extends LeafRouteDef
  ? Simplify<PathObjResultLeaf<P1, P2, P3, P4, P5, P6, P7, P8>>
  : T extends TabRouteDef
  ? Simplify<PathObjWithRoutes<T, P1, P2, P3, P4, P5, P6, P7> & PathObjResultTab<P1, P2, P3, P4, P5, P6, P7, P8>>
  : T extends StackRouteDef
  ? Simplify<PathObjWithRoutes<T, P1, P2, P3, P4, P5, P6, P7> & PathObjResultTab<P1, P2, P3, P4, P5, P6, P7, P8>>
  : never;

type PathObjWithRoutes<
  T extends { routes: any },
  P1 extends string | null = null,
  P2 extends string | null = null,
  P3 extends string | null = null,
  P4 extends string | null = null,
  P5 extends string | null = null,
  P6 extends string | null = null,
  P7 extends string | null = null,
> = {
  [K in keyof T["routes"]]: P7 extends string
    ? PathObj<T["routes"][K], P1, P2, P3, P4, P5, P6, P7, K extends string ? K : never>
    : P6 extends string
    ? PathObj<T["routes"][K], P1, P2, P3, P4, P5, P6, K extends string ? K : never>
    : P5 extends string
    ? PathObj<T["routes"][K], P1, P2, P3, P4, P5, K extends string ? K : never>
    : P4 extends string
    ? PathObj<T["routes"][K], P1, P2, P3, P4, K extends string ? K : never>
    : P3 extends string
    ? PathObj<T["routes"][K], P1, P2, P3, K extends string ? K : never>
    : P2 extends string
    ? PathObj<T["routes"][K], P1, P2, K extends string ? K : never>
    : P1 extends string
    ? PathObj<T["routes"][K], P1, K extends string ? K : never>
    : PathObj<T["routes"][K], K extends string ? K : never>;
};

export type GenerateUrlFn<T extends RouteDef> = <F extends PathObjResultLeaf<any, any, any, any, any, any, any, any>>(
  path: F,
  params: GetInputParamsFromPath<T, F>,
) => UrlString;