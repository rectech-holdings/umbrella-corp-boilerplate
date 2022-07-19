import { FilterNullable } from "../utils/typescriptHelpers.js";
import { RouteDef, LeafRouteDef } from "./routes.js";
import { Simplify } from "type-fest";

const PathObjResultPathArraySecret = Symbol("PathObjResultPathArraySecret");

export type PathObjResult<
  P1 extends string | null = null,
  P2 extends string | null = null,
  P3 extends string | null = null,
  P4 extends string | null = null,
  P5 extends string | null = null,
  P6 extends string | null = null,
  P7 extends string | null = null,
  P8 extends string | null = null,
> = Simplify<{ [PathObjResultPathArraySecret]: FilterNullable<[P1, P2, P3, P4, P5, P6, P7, P8]> }>;

export type GetSecretArrayPathFromPathObjResult<T extends PathObjResult<any, any, any, any, any, any, any, any>> =
  T[typeof PathObjResultPathArraySecret];

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
  ? PathObjResult<P1, P2, P3, P4, P5, P6, P7, P8>
  : T extends { routes: any }
  ? {
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
    } & PathObjResult<P1, P2, P3, P4, P5, P6, P7, P8>
  : never;
