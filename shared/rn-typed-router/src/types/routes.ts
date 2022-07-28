import { LazyExoticComponent, ReactNode } from "react";
import { ScreenProps } from "react-native-screens";
import { Simplify, SetRequired } from "type-fest";
import { ParamsTypeRecord } from "../implementations/params.js";

export type RouteDef = StackRouteDef | TabRouteDef | LeafRouteDef;

export type RouteDefWithoutUI = StackRouteDefWithoutUI | TabRouteDefWithoutUI | LeafRouteDefWithoutUI;

export type RouteDefWithUIOnly = StackRouteDefWithUIOnly | TabRouteDefWithUIOnly | LeafRouteDefWithUIOnly;

export type RouteDefFromMerge<T extends RouteDefWithoutUI> = T extends StackRouteDefWithoutUI
  ? Simplify<
      StackRouteDefWithUIOnly & {
        routes: {
          [Route in keyof T["routes"]]: RouteDefFromMerge<T["routes"][Route]>;
        };
      }
    >
  : T extends TabRouteDefWithoutUI
  ? Simplify<
      TabRouteDefWithUIOnly & {
        routes: {
          [Route in keyof T["routes"]]: RouteDefFromMerge<T["routes"][Route]>;
        };
      }
    >
  : LeafRouteDefWithUIOnly;

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

export type StackRouteDefWithUIOnly = Simplify<
  CommonRouteDefWithUIOnly &
    Pick<StackRouteDef, "type" | "initialRoute"> & {
      routes: { [routePath in string]: RouteDefWithUIOnly };
    }
>;

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
  CommonRouteDefWithUIOnly &
    Pick<TabRouteDef, "type" | "initialRoute" | "BottomTabBar" | "TopTabBar"> & {
      routes: { [routePath in string]: RouteDefWithUIOnly };
    }
>;

export type LeafRouteDef = {
  type: "leaf";
  Component: MultiTypeComponent;
} & CommonRouteDef;

type MultiTypeComponent =
  | (() => ReactNode)
  | React.FC<{}>
  | React.Component<{}>
  | LazyExoticComponent<() => JSX.Element>;

type MultiTypeComponentWithChildren =
  | ((a: { children: ReactNode }) => ReactNode)
  | React.FC<{ children: ReactNode }>
  | React.Component<{ children: ReactNode }>
  | LazyExoticComponent<(a: { children: ReactNode }) => JSX.Element>;

export type LeafRouteDefWithoutUI = Simplify<Pick<LeafRouteDef, "type"> & CommonRouteDefWithoutUI>;
export type LeafRouteDefWithUIOnly = Simplify<Pick<LeafRouteDef, "Component" | "type"> & CommonRouteDefWithUIOnly>;
