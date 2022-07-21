import { RouteDef } from "../types/routes.js";

export function createRouteDefinition<T extends RouteDef>(def: T) {
  //TODO: Verify that the initial route of a stack or a tab has no params

  //TODO: Verify that tab and stack routes has at least one route (e.g. isn't an empty object)

  //TODO: Verify that the initialRouteName exists as a valid route

  //TODO: Verify that the root definition is a tab or stack

  return def;
}
