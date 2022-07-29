import { LazyExoticComponent, ReactNode } from "react";
import { ScreenProps } from "react-native-screens";
import { Simplify, SetRequired } from "type-fest";
import { ParamsTypeRecord } from "../implementations/params.js";

export type RouteDef = StackRouteDef | TabRouteDef | LeafRouteDef;

export type RouteDefWithoutUI = StackRouteDefWithoutUI | TabRouteDefWithoutUI | LeafRouteDefWithoutUI;

export type RouteDefWithUIOnly = StackRouteDefWithUIOnly | TabRouteDefWithUIOnly | LeafRouteDefWithUIOnly;

export type RouteDefFromMerge<T extends RouteDefWithoutUI> = T extends StackRouteDefWithoutUI
  ? Simplify<
      Omit<T, "routes"> &
        StackRouteDefWithUIOnly & { routes: { [K in keyof T["routes"]]: RouteDefFromMerge<T["routes"][K]> } }
    >
  : T extends TabRouteDefWithoutUI
  ? Simplify<
      Omit<T, "routes"> &
        TabRouteDefWithUIOnly & { routes: { [K in keyof T["routes"]]: RouteDefFromMerge<T["routes"][K]> } }
    >
  : Simplify<T & LeafRouteDefWithUIOnly>;

type CommonRouteDefWithUIOnly = {
  childScreenProps?: ScreenProps;
  screenProps?: ScreenProps;
  Wrapper?: MultiTypeComponentWithChildren;
  Header?: MultiTypeComponent;
};

type CommonRouteDefWithoutUI = {
  params?: ParamsTypeRecord;
};

type CommonRouteDef = Simplify<CommonRouteDefWithUIOnly & CommonRouteDefWithoutUI>;

export type StackRouteDef = {
  type: "stack";
  initialRoute?: string;
  routes: { [routePath in string]: RouteDef };
} & CommonRouteDef;

export type StackRouteDefWithoutUI = Simplify<
  CommonRouteDefWithoutUI &
    Pick<StackRouteDef, "type"> & {
      routes: { [routePath in string]: RouteDefWithoutUI };
    }
>;

export type StackRouteDefWithUIOnly = Simplify<CommonRouteDefWithUIOnly & Pick<StackRouteDef, "type" | "initialRoute">>;

export type TabRouteDef = {
  type: "tab" | "switch";
  initialRoute?: string;
  TopTabBar?: MultiTypeComponent;
  BottomTabBar?: MultiTypeComponent;
  routes: { [routePath in string]: RouteDef };
} & CommonRouteDef;

export type TabRouteDefWithoutUI = Simplify<
  CommonRouteDefWithoutUI &
    Pick<TabRouteDef, "type"> & {
      routes: { [routePath in string]: RouteDefWithoutUI };
    }
>;

export type TabRouteDefWithUIOnly = Simplify<
  CommonRouteDefWithUIOnly & Pick<TabRouteDef, "type" | "initialRoute" | "BottomTabBar" | "TopTabBar">
>;

export type LeafRouteDef = Simplify<
  {
    type: "leaf";
    Component: MultiTypeComponent;
  } & Omit<CommonRouteDef, "childScreenProps">
>;

export type MultiTypeComponent<Props = {}> = ((a: Props) => ReactNode) | React.FC<Props> | React.Component<Props>;

type MultiTypeComponentWithChildren =
  | ((a: { children: ReactNode }) => ReactNode)
  | React.FC<{ children: ReactNode }>
  | React.Component<{ children: ReactNode }>;

export type LeafRouteDefWithoutUI = Simplify<Pick<LeafRouteDef, "type"> & CommonRouteDefWithoutUI>;
export type LeafRouteDefWithUIOnly = Simplify<Pick<LeafRouteDef, "Component" | "type"> & CommonRouteDefWithUIOnly>;
