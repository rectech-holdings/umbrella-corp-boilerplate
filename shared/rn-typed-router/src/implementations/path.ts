import { GenerateUrlFn, PathObj } from "../types/path.js";
import { RouteDef } from "../types/routes.js";

export function createPathsObject<T extends RouteDef>(routeDef: T): PathObj<T> {
  return null as any;
}

export function createUrlGenerator<T extends RouteDef>(routeDef: T): GenerateUrlFn<T> {
  return null as any;
}
