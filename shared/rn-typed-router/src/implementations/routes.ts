import { RouteDef } from "../types/routes.js";

export function createRouteDefinition<T extends RouteDef>(def: T) {
  //TODO: Verify paths with params (e.g. :someParam) also have a param object with the named properties

  //TODO: Verify that the initial route of a stack has no params

  //TODO: Verify that tab and stack routes has at least one route (e.g. isn't an empty object)

  //TODO: Verify that the initialRouteName exists as a valid route

  return def;
}
