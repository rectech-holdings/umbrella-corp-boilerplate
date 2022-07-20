import { RouteDef } from "./types/routes.js";
import { CoreRouter } from "./types/router.js";
import { createPathsObject, createUrlGenerator } from "./implementations/path.js";

export { createRouteDefinition } from "./implementations/routes.js";
export { createPathsObject } from "./implementations/path.js";

export function createCoreRouter<T extends RouteDef>(rootDef: T): CoreRouter<T> {
  return {
    PATHS: createPathsObject(rootDef),
    generateUrl: createUrlGenerator(rootDef),
  };
}
