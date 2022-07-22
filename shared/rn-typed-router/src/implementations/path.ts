import { GenerateUrlFn, PathObj } from "../types/path.js";
import { RouteDef, RouteDefWithoutUI } from "../types/routes.js";

export function createPathsObject<T extends RouteDefWithoutUI>(routeDef: T): PathObj<T> {
  return null as any;
}

export function createUrlGenerator<T extends RouteDefWithoutUI>(routeDef: T): GenerateUrlFn<T> {
  return null as any;
}
