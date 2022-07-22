import { InferParamsOutput, ParamsTypeRecord as ParamsTypeRecord } from "../implementations/params.js";
import { DistributiveOmit } from "../utils/typescript-utils.js";
import { LeafRouteDef, RouteDef, StackRouteDef, TabRouteDef } from "./routes.js";

type RouteDefRecord = Record<string, RouteDef>;

type ParamsValueRecord<T extends ParamsTypeRecord> = InferParamsOutput<T>;

export type StackNavigationState<
  K extends string | number | symbol,
  ParamsType extends ParamsTypeRecord | undefined,
  RouteRecord extends RouteDefRecord,
> = {
  type: "stack";
  path: K;
  params?: ParamsType extends ParamsTypeRecord ? ParamsValueRecord<ParamsType> : undefined;
  stack: InnerNavigationStateRecord<RouteRecord>[];
};

export type TabNavigationState<
  K extends PropertyKey,
  ParamsType extends ParamsTypeRecord | undefined,
  RouteRecord extends RouteDefRecord,
> = {
  type: "tab" | "switch";
  path: K;
  params?: ParamsType extends ParamsTypeRecord ? ParamsValueRecord<ParamsType> : undefined;
  focusedTabIndex: number;
  tabs: InnerNavigationStateRecord<RouteRecord>[];
};

export type LeafNavigationState<K extends PropertyKey, ParamsType extends ParamsTypeRecord | undefined> = {
  type: "leaf";
  path: K;
  params?: ParamsType extends ParamsTypeRecord ? ParamsValueRecord<ParamsType> : undefined;
};

export type InnerNavigationState =
  | LeafNavigationState<any, any>
  | TabNavigationState<any, any, any>
  | StackNavigationState<any, any, any>;

type InnerNavigationStateRecord<ThisRouteDefRecord extends RouteDefRecord> = {
  [K in keyof ThisRouteDefRecord]: ThisRouteDefRecord[K] extends StackRouteDef
    ? StackNavigationState<K, ThisRouteDefRecord[K]["params"], ThisRouteDefRecord[K]["routes"]>
    : ThisRouteDefRecord[K] extends TabRouteDef
    ? TabNavigationState<K, ThisRouteDefRecord[K]["params"], ThisRouteDefRecord[K]["routes"]>
    : LeafNavigationState<K, ThisRouteDefRecord[K]["params"]>;
}[keyof ThisRouteDefRecord];

export type RootNavigationState<T extends RouteDef> = T extends TabRouteDef
  ? {
      type: "root-tab" | "root-switch";
      focusedTabIndex: number;
      tabs: InnerNavigationStateRecord<T["routes"]>[];
    }
  : T extends StackRouteDef
  ? {
      type: "root-stack";
      stack: InnerNavigationStateRecord<T["routes"]>[];
    }
  : never;

/**
 * An array that maps _exactly_ to a nav state path, suitable for accessing or setting with lodash.
 * Is composed of triplets of form: `['stack' | 'tabs', number, string]` where the third value is the route name
 * E.g. `_.get(rootNavState, someAbsNavStatePath)`
 * E.g. `_.set(rootNavState, someAbsNavStatePath, someDeepStateVal)`
 */
export type AbsNavStatePath = (number | string)[];

export type NavigateOptions = {
  /**
   * If true will reset all stack navigators (that match the navigation path) to their initial state before adding.
   * By default is true for the `navigateToUrl` method and false for the `navigate` method
   **/
  resetTouchedStackNavigators?: boolean;
};
