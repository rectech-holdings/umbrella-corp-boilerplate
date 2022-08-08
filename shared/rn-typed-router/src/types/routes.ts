import { LazyExoticComponent, ReactNode } from "react";
import { ScreenProps } from "react-native-screens";
import { Simplify, SetRequired } from "type-fest";
import { ParamsTypeRecord } from "../implementations/params.js";

export type RouteDef = StackRouteDef | SwitchRouteDef | LeafRouteDef;

export type RouteDefWithoutUI = StackRouteDefWithoutUI | SwitchRouteDefWithoutUI | LeafRouteDefWithoutUI;

export type RouteDefWithUIOnly = StackRouteDefWithUIOnly | SwitchRouteDefWithUIOnly | LeafRouteDefWithUIOnly;

export type RouteDefFromMerge<T extends RouteDefWithoutUI> = T extends StackRouteDefWithoutUI
  ? Simplify<
      Omit<T, "routes"> &
        StackRouteDefWithUIOnly & { routes: { [K in keyof T["routes"]]: RouteDefFromMerge<T["routes"][K]> } }
    >
  : T extends SwitchRouteDefWithoutUI
  ? Simplify<
      Omit<T, "routes"> &
        SwitchRouteDefWithUIOnly & { routes: { [K in keyof T["routes"]]: RouteDefFromMerge<T["routes"][K]> } }
    >
  : Simplify<T & LeafRouteDefWithUIOnly>;

type CommonRouteDefWithUIOnly = {
  childScreenProps?: ScreenProps;
  screenProps?: ScreenProps;
  Wrapper?: MultiTypeComponentWithChildren;
  Header?: MultiTypeComponent;
  Footer?: MultiTypeComponent;
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

export type SwitchRouteDef = {
  type: "switch";
  keepChildrenMounted?: boolean;
  initialRoute?: string;
  routes: { [routePath in string]: RouteDef };
} & CommonRouteDef;

export type SwitchRouteDefWithoutUI = Simplify<
  CommonRouteDefWithoutUI &
    Pick<SwitchRouteDef, "type"> & {
      routes: { [routePath in string]: RouteDefWithoutUI };
    }
>;

export type SwitchRouteDefWithUIOnly = Simplify<
  CommonRouteDefWithUIOnly & Pick<SwitchRouteDef, "type" | "initialRoute">
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
