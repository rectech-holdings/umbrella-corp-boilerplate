import { ParamsTypeRecord as ParamsTypeRecord } from "../implementations/params.js";
import { DistributiveOmit } from "../utils/typescript-utils.js";
import { LeafRouteDef, RouteDef, StackRouteDef, TabRouteDef } from "./routes.js";

type RouteDefRecord = Record<string, RouteDef>;

export type StackNavigationState<
  K extends string | number | symbol,
  Params extends ParamsTypeRecord | undefined,
  RouteRecord extends RouteDefRecord,
> = {
  type: "stack";
  path: K;
  params?: Params;
  stack: InnerNavigationStateRecord<RouteRecord>[];
};

export type TabNavigationState<
  K extends PropertyKey,
  Params extends ParamsTypeRecord | undefined,
  RouteRecord extends RouteDefRecord,
> = {
  type: "tab" | "switch";
  path: K;
  params?: Params;
  focusedTabIndex: number;
  tabs: InnerNavigationStateRecord<RouteRecord>[];
};

export type LeafNavigationState<K extends PropertyKey, Params extends ParamsTypeRecord | undefined> = {
  type: "leaf";
  path: K;
  params?: Params;
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
