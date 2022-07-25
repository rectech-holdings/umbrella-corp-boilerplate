import { ReactNode } from "react";
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
  Wrapper?: (a: { children: ReactNode }) => ReactNode;
  getWrapper?: () => (a: { children: ReactNode }) => ReactNode;
  Header?: () => ReactNode;
  getHeader?: () => () => ReactNode;
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
  TopTabBar?: () => ReactNode;
  getTopTabBar?: () => () => ReactNode;
  BottomTabBar?: () => ReactNode;
  getBottomTabBar?: () => () => ReactNode;
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
    Pick<TabRouteDef, "type" | "initialRoute" | "BottomTabBar" | "TopTabBar" | "getBottomTabBar" | "getTopTabBar"> & {
      routes: { [routePath in string]: RouteDefWithUIOnly };
    }
>;

export type LeafRouteDef = {
  type: "leaf";
  Component?: () => ReactNode;
  getComponent?: () => () => ReactNode;
} & CommonRouteDef;

export type LeafRouteDefWithoutUI = Simplify<Pick<LeafRouteDef, "type"> & CommonRouteDefWithoutUI>;
export type LeafRouteDefWithUIOnly = Simplify<
  Pick<LeafRouteDef, "getComponent" | "Component" | "type"> & CommonRouteDefWithUIOnly
>;
