import { RouteDef, RouteDefFromMerge, RouteDefWithoutUI, RouteDefWithUIOnly } from "../types/routes.js";
import { DeepGenericMerge } from "../utils/deepGenericMerge.js";
import _ from "lodash";

export function createRouteDefinition<T extends RouteDef>(def: T): T {
  //TODO: Verify that component properties point to the correct type of function, etc

  return createNonUIRouteDefinition(def);
}

/**
 * The backend needs to know the url structure so that it can generate correct links. This method enables that.
 */
export function createNonUIRouteDefinition<T extends RouteDefWithoutUI>(def: T): T {
  //TODO: Verify that route names do NOT have any special characters or slashes

  //TODO: Verify that a child does not have a param with the same name as a parent param

  //TODO: Verify that the initial route of a stack or a tab has no params

  //TODO: Verify that tab and stack routes have at least one route (e.g. isn't an empty object)

  //TODO: Verify that the initialRouteName exists as a valid route

  //TODO: Verify that the root definition is a tab or stack

  return def;
}

/**
 * Need this method on the clients in order to declare the missing half of a NonUI Route Definition
 */
export function extendNonUIRouteDefinition<T1 extends RouteDefWithoutUI, T2 extends RouteDefFromMerge<T1>>(
  def1: T1,
  def2: T2,
): DeepGenericMerge<T1, T2> {
  return _.merge(def1, def2) as any;
}
