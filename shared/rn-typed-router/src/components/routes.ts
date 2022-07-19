import { ReactNode } from "react";
import { ScreenProps } from "react-native-screens";
import { ParamsBase } from "./params.js";

export type RouteDef = StackRouteDef | TabRouteDef | LeafRouteDef;

type CommonRouteDef = {
  childScreenProps?: ScreenProps;
  screenProps?: ScreenProps;
  Wrapper?: (a: { children: ReactNode }) => ReactNode;
  getWrapper?: () => (a: { children: ReactNode }) => ReactNode;
  Header?: () => ReactNode;
  getHeader?: () => () => ReactNode;
  params?: ParamsBase;
};

export type StackRouteDef = {
  type: "stack";
  initialRoute?: string;
  routes: { [routePath in string]: RouteDef };
} & CommonRouteDef;

export type TabRouteDef = {
  type: "tab" | "switch";
  initialRoute?: string;
  TopTabBar?: () => ReactNode;
  getTopTabBar?: () => () => ReactNode;
  BottomTabBar?: () => ReactNode;
  getBottomTabBar?: () => () => ReactNode;
  routes: { [routePath in string]: RouteDef };
} & CommonRouteDef;

type LeafRouteBaseDef = { type: "leaf" } & CommonRouteDef;
export type LeafRouteDef =
  | (LeafRouteBaseDef & { Component: () => ReactNode })
  | (LeafRouteBaseDef & { getComponent: () => () => ReactNode });
