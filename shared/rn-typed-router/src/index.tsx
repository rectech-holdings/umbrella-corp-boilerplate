import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { Screen, ScreenProps, ScreenContainer, ScreenStack, enableFreeze } from "react-native-screens";
import { BackHandler, Keyboard, Platform, StyleSheet, View } from "react-native";
import { dequal } from "dequal/lite";
import _ from "lodash";
import { match, Match, MatchFunction } from "path-to-regexp";
import { createZustandStore, ZustandStore } from "./utils/createZustandStore.js";
import { deferred, Deferred } from "./utils/deferred.js";
import { usePreviousValue } from "./utils/usePreviousValue.js";
import { useIsMountedRef } from "./utils/useIsMountedRef.js";
import { RouteDef, LeafRouteDef, StackRouteDef, TabRouteDef } from "./components/routes.js";
import { GetInputParamsFromPath, ParamsBase, ParamsInputObj, ParamsOutputObj } from "./components/params.js";
import { PathObj, PathObjResult } from "./components/path.js";

enableFreeze(true);

type Router<T extends RouteDef> = {
  navigation: NavigationObj<T>;
  paths: PathObj<T>;
  useParams<D extends ParamsBase>(paramsSelector: (paramsObj: ParamsOutputObj<T>) => D): D;
  goBack: () => boolean;
  navigateToStringUrl: (urlPath: string) => void;
  generateUrl: <F extends PathObjResult<any, any, any, any, any, any, any, any>>(
    path: F,
    params: GetInputParamsFromPath<T, F>,
  ) => string;
  Navigator: (a: { getInitialState?: () => NavigationState<T> | null | undefined }) => JSX.Element | null;
  useIsFocused: () => boolean;
  useOnFocusChange: (fn: (isFocused: boolean) => void) => void;
  getCurrentlyFocusedUrl: () => string;
  subscribeToCurrentlyFocusedPath: (subFn: (currPath: string) => any) => () => void;
};

type NavigateFn<T extends StackRouteDef | TabRouteDef> = <Defs extends T["routes"], R extends keyof Defs>(
  r: R,
  params?: Defs[R]["params"],
) => void;

export type NavigationObj<T extends RouteDef> = T extends LeafRouteDef
  ? never
  : T extends StackRouteDef
  ? {
      [key in keyof T["routes"]]: NavigationObj<T["routes"][key]>;
    } & {
      //TODO: Getting types on the params isn't working... Not sure why... Fix it.
      $push: NavigateFn<T>;
      $navigate: NavigateFn<T>;
      $pop: (numToPop?: number) => void;
      $popToTop: () => void;
    }
  : T extends TabRouteDef
  ? { [key in keyof T["routes"]]: NavigationObj<T["routes"][key]> } & {
      $goTo: NavigateFn<T>;
      $goToWithReset: NavigateFn<T>;
      $navigate: NavigateFn<T>;
    }
  : never;

export function createRouteDefinition<T extends RouteDef>(def: T) {
  //TODO: Verify paths with params (e.g. :someParam) also have a param object with the named properties

  //TODO: Verify that the initial route of a stack has no params

  //TODO: Verify that tab and stack routes has at least one route (e.g. isn't an empty object)

  //TODO: Verify that the initialRouteName exists as a valid route

  return def;
}

function setStateAtPath(stateRaw: NavigationState<any>, path: string[], newVal: NavigationState<any>) {
  const pathArr = path[0] === "" ? path.slice() : ["", ...path];
  let nextPath = pathArr.shift();
  if (stateRaw.path !== nextPath) {
    throw new Error("getStateAtPath was used incorrectly. Path does not match");
  }
  let currState: NavigationState<any> | undefined = stateRaw;

  while (pathArr.length && currState) {
    nextPath = pathArr.shift();
    let stackOrTabArr: NavigationStateInner<any>[];
    if ("stack" in currState) {
      stackOrTabArr = currState.stack;
    } else if ("tabs" in currState) {
      stackOrTabArr = currState.tabs;
    } else {
      throw new Error("getStateAtPath was used incorrectly. Should not be called on leaf nodes");
    }

    const index = _.findLastIndex(stackOrTabArr, (a) => a.path === nextPath) as any;
    if (pathArr.length === 0) {
      if (index !== -1) {
        stackOrTabArr[index] = newVal;
      } else {
        throw new Error("Unable to set value at path! Must modify setStateAtPath to support non-existent paths.");
      }
    } else {
      currState = stackOrTabArr[index] as any;
    }
  }

  return (currState ?? null) as any;
}

function getStateAtPath(stateRaw: NavigationState<any>, path: string[]): NavigationState<any> | null {
  const pathArr = path[0] === "" ? path.slice() : ["", ...path];
  let nextPath = pathArr.shift();
  if (stateRaw.path !== nextPath) {
    throw new Error("getStateAtPath was used incorrectly. Path does not match");
  }
  let currState: NavigationState<any> | undefined = stateRaw;

  while (pathArr.length && currState) {
    nextPath = pathArr.shift();
    if ("stack" in currState) {
      currState = _.findLast(currState.stack, (a) => a.path === nextPath) as any;
    } else if ("tabs" in currState) {
      currState = currState.tabs.find((a) => a.path === nextPath) as any;
    } else {
      throw new Error("getStateAtPath was used incorrectly. Should not be called on leaf nodes");
    }
  }

  return (currState ?? null) as any;
}

const getDefCache = new Map<object, Map<string, any>>();
function getDefAtPath(rootDef: RouteDef, path: string[]): RouteDef | null {
  const strPath = path.join("");
  if (getDefCache.get(rootDef)?.get(strPath)) {
    return getDefCache.get(rootDef)?.get(strPath);
  }

  const pathArr = path[0] === "" ? path.slice(1) : path.slice();
  let currDef: RouteDef = rootDef;

  while (pathArr.length) {
    const nextPath = pathArr.shift() as string;
    if (currDef.type !== "leaf") {
      if (!currDef.routes[nextPath]) {
        throw new Error(
          `Invalid path given to getDefAtPath! The route ${nextPath} cannot be found in ${Object.keys(
            currDef.routes,
          ).toString()}`,
        );
      }
      currDef = currDef.routes[nextPath];
    }
  }

  if (!getDefCache.get(rootDef)) {
    getDefCache.set(rootDef, new Map());
  }
  if (!getDefCache.get(rootDef)?.get(strPath)) {
    getDefCache.get(rootDef)?.set(strPath, currDef);
  }

  return currDef;
}

function getComponentAtPath(
  rootDef: RouteDef,
  path: string[],
  type: "leaf" | "topTabBar" | "bottomTabBar" | "header",
): null | (() => JSX.Element);
function getComponentAtPath(
  def: RouteDef,
  path: string[],
  type: "wrapper",
): null | ((a: { children: ReactNode }) => JSX.Element);
function getComponentAtPath(
  def: RouteDef,
  path: string[],
  type: "leaf" | "topTabBar" | "bottomTabBar" | "header" | "wrapper",
): null | (() => JSX.Element) | ((a: { children: ReactNode }) => JSX.Element) {
  const childDef = getDefAtPath(def, path);
  const pathStr = path.join("/");

  if (!childDef) {
    return null;
  }

  let Component: (() => ReactNode) | ((a: { children: ReactNode }) => ReactNode) | false | undefined;
  if (type === "leaf") {
    if ("Component" in childDef) {
      Component = invariantFn(childDef.Component, "component was defined on a route but is not a react component");
    } else if ("getComponent" in childDef) {
      Component = invariantFn(
        childDef.getComponent(),
        "getComponent was defined on route but does not return a react component! " + path.join("/"),
      );
    }
  } else if (type === "bottomTabBar") {
    if ("BottomTabBar" in childDef) {
      Component = invariantFn(
        childDef.BottomTabBar,
        "bottomTabBar was defined on route but is not a react component! " + path.join("/"),
      );
    } else if ("getBottomTabBar" in childDef) {
      Component = invariantFn(
        childDef.getBottomTabBar?.(),
        "getBottomTabBar was defined on route but does not return a react component! " + path.join("/"),
      );
    }
  } else if (type === "topTabBar") {
    if ("TopTabBar" in childDef) {
      Component = invariantFn(
        childDef.TopTabBar,
        "topTabBar was defined on route but is not a react component! " + path.join("/"),
      );
    } else if ("getTopTabBar" in childDef) {
      Component = invariantFn(
        childDef.getTopTabBar?.(),
        "getTopTabBar was defined on route but does not return a react component",
      );
    }
  } else if (type === "wrapper") {
    if (childDef.getWrapper) {
      Component = invariantFn(
        childDef.getWrapper?.(),
        "getWrapper was defined on route but does not return a react component! " + path.join("/"),
      );
    } else if (childDef.Wrapper) {
      Component = invariantFn(
        childDef.Wrapper,
        "Wrapper was defined on a route but is not a react component! " + path.join("/"),
      );
    }
  } else {
    if (childDef.getHeader) {
      Component = invariantFn(
        childDef.getHeader?.(),
        "getHeader was defined on route but does not return a react component! " + path.join("/"),
      );
    } else if (childDef.Header) {
      Component = invariantFn(
        childDef.Header,
        "header was defined on a route but is not a react component! " + path.join("/"),
      );
    }
  }

  if (Component) {
    return Component as any;
  } else {
    return null;
  }
}

type RouteDefRecord = Record<string, RouteDef>;

type StackNavigationState<
  K extends string | number | symbol,
  Params extends ParamsBase | undefined,
  RouteRecord extends RouteDefRecord,
> = {
  path: K;
  params?: Params;
  stack: NavigationStateInner<RouteRecord>[];
};

type TabNavigationState<
  K extends string | number | symbol,
  Params extends ParamsBase | undefined,
  RouteRecord extends RouteDefRecord,
> = {
  path: K;
  params?: Params;
  focusedTabIndex: number;
  tabs: NavigationStateInner<RouteRecord>[];
};

type LeafNavigationState<K extends string | number | symbol, Params extends ParamsBase | undefined> = {
  path: K;
  params?: Params;
};

type NavigationStateInner<ThisRouteDefRecord extends RouteDefRecord> = {
  [K in keyof ThisRouteDefRecord]: ThisRouteDefRecord[K] extends StackRouteDef
    ? StackNavigationState<K, ThisRouteDefRecord[K]["params"], ThisRouteDefRecord[K]["routes"]>
    : ThisRouteDefRecord[K] extends TabRouteDef
    ? TabNavigationState<K, ThisRouteDefRecord[K]["params"], ThisRouteDefRecord[K]["routes"]>
    : LeafNavigationState<K, ThisRouteDefRecord[K]["params"]>;
}[keyof ThisRouteDefRecord];

export type NavigationState<T extends RouteDef> = NavigationStateInner<{ "": T }>;

type StateSelectorObj<T extends RouteDef, ParentPath extends PropertyKey = ""> = T extends LeafRouteDef
  ? null | Omit<LeafNavigationState<ParentPath, T["params"]>, "path">
  : T extends TabRouteDef
  ?
      | null
      | ({ [key in keyof T["routes"]]: StateSelectorObj<T["routes"][key], key> } & {
          $partial: null | Omit<
            TabNavigationState<ParentPath, T["params"], T["routes"]> & { focusedPath: keyof T["routes"] },
            "path"
          >;
        })
  : T extends StackRouteDef
  ?
      | null
      | ({ [key in keyof T["routes"]]: StateSelectorObj<T["routes"][key], key> } & {
          $partial: null | Omit<
            StackNavigationState<ParentPath, T["params"], T["routes"]> & { focusedPath: keyof T["routes"] },
            "path"
          >;
        })
  : never;

function createStateSelectorObj<T extends RouteDef>(
  def: T,
  getRootState: () => NavigationState<any>,
  parentPath = [] as string[],
): StateSelectorObj<T> {
  if (def.type === "leaf") {
    return true as any;
  } else {
    const obj: any = {
      $partial: true, //The proxy will return the proper value for leaf and $partial values. So just any value.
    };

    Object.keys(def.routes).forEach((k) => {
      obj[k] = createStateSelectorObj((def.routes as any)[k], getRootState, parentPath.concat(k));
    });

    return new Proxy(obj, {
      set: () => false,
      get(target, key: string) {
        if (key === "$partial") {
          const rawState = getStateAtPath(getRootState(), parentPath);
          if (!rawState) {
            return null;
          }

          const { path, ...state } = rawState;

          let focusedPath: string | null = null;
          if ("stack" in state) {
            focusedPath = state.stack.slice(-1).pop()?.path || "";
          } else if ("tabs" in state) {
            focusedPath = state.tabs[state.focusedTabIndex]?.path || "";
          }

          return focusedPath ? { ...state, focusedPath } : state;
        } else if (def.routes[key]?.type === "leaf") {
          const rawState = getStateAtPath(getRootState(), parentPath.concat(key));
          if (!rawState) {
            return null;
          }

          const { path, ...state } = rawState;

          return state;
        } else {
          return target[key];
        }
      },
    });
  }
}

function createParamsObj<T extends RouteDef>(
  def: T,
  parentPath = [] as string[],
  parentParams: Record<string, any> = {},
): ParamsOutputObj<T> {
  const currParams = { ...(parentParams || {}), ...(def.params || {}) };
  if (def.type === "leaf") {
    return currParams as any;
  } else {
    const ret: any = {
      $partialPath: currParams,
    };

    Object.keys(def.routes).forEach((k) => {
      ret[k] = createParamsObj((def.routes as any)[k], parentPath.concat(k), currParams);
    });
    return ret;
  }
}

function createPathsObj<T extends RouteDef>(def: T, parentPath = [] as string[]): PathObj<T> {
  const thisPath = pathArrToString(parentPath) as any;
  if (def.type === "leaf") {
    return thisPath;
  } else {
    const ret: any = {
      $partialPath: thisPath,
    };
    Object.keys(def.routes).forEach((k) => {
      ret[k] = createPathsObj((def.routes as any)[k], parentPath.concat(k));
    });
    return ret;
  }
}

type FlatPathInfo = { pathStr: string; path: string[]; matcher: MatchFunction<object>; isLeaf: boolean };
function createFlatPathsArr<T extends RouteDef>(def: T, parentPath = [] as string[]): FlatPathInfo[] {
  const thisPath = pathArrToString(parentPath) as any;
  const baseInfo = {
    matcher: match(thisPath, { end: true, decode: decodeURIComponent }),
    pathStr: thisPath,
    path: parentPath,
  };
  if (def.type === "leaf") {
    return [{ ...baseInfo, isLeaf: true }];
  } else {
    const info: FlatPathInfo[] = [{ ...baseInfo, isLeaf: false }];
    Object.keys(def.routes).forEach((k) => {
      info.push(...createFlatPathsArr((def.routes as any)[k], parentPath.concat(k)));
    });
    return info;
  }
}

type ModifyStateForNavigationProps = {
  rootDef: RouteDef;
  currState: NavigationState<any>;
  routeParentPath: string[];
  routeToNavigateTo: string;
  params: ParamsBase;
  opts: {
    shouldReplaceStackParams?: boolean; // E.g. False for the $push method which will add a new stack screen while $navigate will replace params if possible
    mustSpecifyAllParams?: boolean; // E.g.
    shouldResetFinalRoute?: boolean;
  };
};

const modifyStateForNavigation = (p: ModifyStateForNavigationProps) => {
  const allPaths = p.routeParentPath.concat(p.routeToNavigateTo);

  for (let i = 1; i < allPaths.length; i++) {
    const thisPath = allPaths.slice(0, i);
    const route = allPaths[i];

    const isLastIteration = i === allPaths.length - 1;

    const thisState = getStateAtPath(p.currState, thisPath);
    const thisDef = getDefAtPath(p.rootDef, thisPath);

    if (!thisState || !thisDef) {
      throw new Error(`Invalid route ${thisPath} passed to navigate!`);
    }

    const mustSpecifyAllParams = isLastIteration ? true : p.opts?.mustSpecifyAllParams ?? false; //Default to false on non leaf routes

    const thisRoutePath = thisPath.concat(route);
    const thisRouteDef = getDefAtPath(p.rootDef, thisRoutePath)!;

    if ("stack" in thisState) {
      const perfectMatchIndex = thisState.stack.findIndex((thisStackState) => {
        const hasRouteMatch = thisStackState.path === route;
        const hasParamsMatch = mustSpecifyAllParams
          ? Object.keys(thisStackState.params || {}).every(
              (k) => (thisStackState.params || {})[k] === ((p.params as any) || {})[k],
            )
          : true;
        return hasRouteMatch && hasParamsMatch;
      });

      const decentMatchIndex = thisState.stack.findIndex((thisStackState) => {
        const hasRouteMatch = thisStackState.path === route;
        return hasRouteMatch;
      });

      const shouldReplaceStackParams = p.opts?.shouldReplaceStackParams ?? true; //$navigate called by itself will replace stack params

      if (perfectMatchIndex !== -1) {
        if (perfectMatchIndex !== thisState.stack.length - 1) {
          thisState.stack = thisState.stack.slice(0, perfectMatchIndex + 1);
        }
      } else if (decentMatchIndex !== -1 && shouldReplaceStackParams) {
        if (thisRouteDef.params) {
          const requiredParams = Object.keys(thisRouteDef.params);
          if (!requiredParams.every((k) => k in p.params)) {
            throw new Error(
              `Unable to navigate to stack path ${route}! Only have parameters ${Object.keys(
                p.params,
              )} but must have ${requiredParams}`,
            );
          }
          thisState.stack[decentMatchIndex].params = _.pick(p.params, Object.keys(thisRouteDef.params));
        }

        if (decentMatchIndex !== thisState.stack.length - 1) {
          thisState.stack = thisState.stack.slice(0, decentMatchIndex + 1);
        }
      } else {
        const initState = generateInitialState(p.rootDef, thisRoutePath, p.params);
        thisState.stack.push(initState);
      }
    } else if ("tabs" in thisState) {
      const existingIndex = thisState.tabs.findIndex((a) => a.path === route);
      if (existingIndex !== -1) {
        if (thisState.focusedTabIndex !== existingIndex) {
          thisState.focusedTabIndex = existingIndex;
        }

        if (thisRouteDef.params) {
          const requiredParams = Object.keys(thisRouteDef.params);
          if (!requiredParams.every((k) => k in p.params)) {
            throw new Error(
              `Unable to navigate to tab path ${route} due to missing parameters! Only supplied ${Object.keys(
                p.params,
              )} but must have ${requiredParams}`,
            );
          }
          thisState.tabs[existingIndex].params = _.pick(p.params, Object.keys(thisRouteDef.params || {}));
        }
      } else {
        const thisTabPath = thisPath.concat(route);
        const initState = generateInitialState(p.rootDef, thisTabPath, p.params);

        if (thisDef.type === "switch") {
          thisState.tabs = [initState];
        } else {
          thisState.tabs.push(initState);
          thisState.focusedTabIndex = thisState.tabs.length - 1;
        }
      }
    } else {
      throw new Error("Router internal logic is bad somewhere. Tried to navigate on leaf state");
    }

    if (isLastIteration && p.opts?.shouldResetFinalRoute) {
      setStateAtPath(p.currState, thisRoutePath, generateInitialState(p.rootDef, thisRoutePath, p.params));
      break;
    }
  }
};

let deferredNavigationActions: Omit<ModifyStateForNavigationProps, "currState">[] = [];
function createNavigationObj<T extends RouteDef>(
  rootDef: T,
  deferredDataProm: DeferredDataProm,
  navObjectPath = [] as string[],
): NavigationObj<T> {
  const def = getDefAtPath(rootDef, navObjectPath);

  if (!def) {
    throw new Error("Unable to generate navigation object! Definition not found at path " + navObjectPath.toString());
  }

  if (def.type === "leaf") {
    throw new Error("Should never create navigation object on leaf node");
  }

  let ret: any = {};
  Object.keys(def.routes).forEach((k) => {
    const childDef = (def.routes as any)[k] as RouteDef;

    if (childDef.type !== "leaf") {
      ret[k] = createNavigationObj(rootDef, deferredDataProm, navObjectPath.concat(k));
    }
  });

  // const $navigate: NavigateFnWithExtra<any> = (route, params, extraOpts) => {
  //   const props: Omit<ModifyStateForNavigationProps, "currState"> = {
  //     opts: extraOpts || {},
  //     params,
  //     rootDef,
  //     routeParentPath: navObjectPath,
  //     routeToNavigateTo: route as string,
  //   };

  //   if (!deferredDataProm.resolvedValue) {
  //     deferredNavigationActions.push(props);
  //   } else {
  //     Keyboard.dismiss();
  //     deferredDataProm.resolvedValue.stateStore.modifyImmutably((currState) => {
  //       modifyStateForNavigation({
  //         ...props,
  //         currState,
  //       });
  //     });
  //   }
  // };

  if (def.type === "stack") {
    ret = {
      ...ret,
      // $navigate,
      $push: (route: string, params?: ParamsBase) => {
        // return $navigate(route, params, {
        //   mustSpecifyAllParams: false,
        //   shouldReplaceStackParams: false,
        //   shouldResetFinalRoute: false,
        // });
      },
      $pop: (numToPop = 1) => {
        if (!deferredDataProm.resolvedValue) {
          throw new Error("Unable to $pop before the router has rendered once!");
        }
        Keyboard.dismiss();
        deferredDataProm.resolvedValue.stateStore.modifyImmutably((currState) => {
          const state = getStateAtPath(currState, navObjectPath);
          if (!state || !("stack" in state)) {
            throw new Error("Unable to find state to $pop! Router internal logic is bad somewhere");
          }

          if (state.stack.length - numToPop < 1) {
            throw new Error("Not permitted to pop a stack to empty! Must have at least one item in the stack");
          }

          state.stack.splice(state.stack.length - numToPop, numToPop);
        });
      },
      $popToTop: () => {
        if (!deferredDataProm.resolvedValue) {
          throw new Error("Unable to $pop before the router has rendered once!");
        }
        Keyboard.dismiss();
        deferredDataProm.resolvedValue.stateStore.modifyImmutably((currState) => {
          const state = getStateAtPath(currState, navObjectPath);
          if (!state || !("stack" in state)) {
            throw new Error("Unable to find state to $pop! Router internal logic is bad somewhere");
          }

          state.stack.splice(1, state.stack.length - 1);
        });
      },
    };
  } else {
    ret = {
      ...ret,
      // $navigate,
      // $goTo: (route: string, params?: ParamsBase) => {
      //   return $navigate(route, params, { mustSpecifyAllParams: false });
      // },
      // $goToWithReset: (route: string, params?: ParamsBase) => {
      //   return $navigate(route, params, { shouldResetFinalRoute: true, mustSpecifyAllParams: false });
      // },
    };
  }

  return ret;
}

function generateInitialState<T extends RouteDef>(
  rootDef: T,
  path: string[],
  params?: ParamsBase,
): NavigationState<any> {
  const def = getDefAtPath(rootDef, path);

  if (!def) {
    throw new Error("Invalid path passed to generateInitialState: " + path.join("/"));
  }

  let initState: NavigationState<any>;
  const pathStr = path.slice().pop() as any;
  if (def.type === "stack") {
    const initialRouteName = def.initialRoute || Object.keys(def.routes)[0];

    const stack = [generateInitialState(rootDef, path.concat(initialRouteName), params)];
    initState = {
      path: pathStr as any,
      stack,
    };
  } else if (def.type === "tab" || def.type === "switch") {
    const initialRouteName = def.initialRoute || Object.keys(def.routes)[0];

    const tabs = [generateInitialState(rootDef, path.concat(initialRouteName), params)];
    initState = {
      focusedTabIndex: 0,
      path: pathStr as any,
      tabs,
    };
  } else {
    initState = {
      path: pathStr as any,
    };
  }

  if (params) {
    initState.params = _.pick(params, Object.keys(def.params || {}));
  }

  return initState;
}

type RouteInfoType = { params: ParamsBase; path: string[] };
const RouteInfoContext = createContext<null | RouteInfoType>(null);

const RouteInfoProvider = (p: { children: ReactNode; path: string[]; currParams?: ParamsBase }) => {
  // const { params } = useContext(RouteInfoContext) || {};

  // let theseParams = { ...(params || {}), ...(p.currParams || {}) };
  // theseParams = _.mapValues(theseParams, (param) => {
  //   if (String(parseInt(param.toString())) === param) {
  //     return parseInt(param);
  //   } else {
  //     return param;
  //   }
  // });

  // const value = useObjectMemo({
  //   params: theseParams,
  //   path: p.path,
  // });

  // return <RouteInfoContext.Provider value={value}>{p.children}</RouteInfoContext.Provider>;
  return p.children as JSX.Element;
};

function useRouteInfoContext(o: { optional: true }): RouteInfoType | null;
function useRouteInfoContext(): RouteInfoType;
function useRouteInfoContext(o?: { optional?: true }) {
  const context = useContext(RouteInfoContext);

  if (!context && !o?.optional) {
    throw new Error("No route info context found! Ensure you are within a component inside a main Navigator");
  }

  return context;
}

type DeferredDataProm = Deferred<{
  stateStore: ZustandStore<NavigationState<any>>;
  stateSelectorObj: StateSelectorObj<any, any>;
}>;

export function createRouter<T extends RouteDef>(
  rootDef: T,
  opts?: { urlRewriter?: (s: string) => string },
): Router<T> {
  //This is super weird, but the state store can't be instantiated until the first render. But meanwhile, a bunch of objects need access to the state store.
  //Ergo, we create an object which WILL point to the state store and other data.
  const deferredDataProm: DeferredDataProm = deferred();

  const navigation = createNavigationObj(rootDef, deferredDataProm, [""]);
  const paramsObj = createParamsObj(rootDef);

  const paths = createPathsObj(rootDef);
  const flatPaths = createFlatPathsArr(rootDef);

  function navigateToUrl(pathToNavigateTo: string) {
    pathToNavigateTo = opts?.urlRewriter ? opts.urlRewriter(pathToNavigateTo) : pathToNavigateTo;

    let thisMatch: { match: Match<any>; pathStr: string; path: string[]; isLeaf: boolean } | null = null;
    for (let { matcher, path, pathStr, isLeaf } of flatPaths) {
      if (!pathStr) {
        continue;
      }

      const test = matcher(pathToNavigateTo);
      if (test) {
        thisMatch = { match: test, path, pathStr, isLeaf };
        break;
      }
    }

    if (thisMatch && thisMatch.match) {
      const thisMatchPath = thisMatch.path.slice(0, thisMatch.path.length - 1);
      const thisMatchRoute = thisMatch.path.slice().pop();
      const nav = thisMatchPath.length ? _.get(navigation, thisMatchPath) : navigation;

      if (nav && "$navigate" in nav) {
        // const thisNavigate: NavigateFnWithExtra<any> = nav.$navigate;
        // thisNavigate(thisMatchRoute as any, thisMatch.match.params, {
        //   shouldReplaceStackParams: true,
        //   mustSpecifyAllParams: true,
        // });
      } else {
        throw new Error(`Unable to navigate to path ${pathToNavigateTo} for unknown reason`);
      }
    } else {
      throw new Error("Unable to find route for path " + pathToNavigateTo);
    }
  }

  const InnerNavigator: InnerNavigator = React.memo((p) => {
    if (!useHasEverBeenFocused(p.thisPath)) {
      return null;
    }

    const innerNavigatorProps: InnerNavigatorProps = {
      InnerNavigator: InnerNavigator,
      rootDef,
      thisPath: p.thisPath,
      thisState: p.thisState,
      deferredDataProm,
    };

    let inner: ReactNode;
    if ("stack" in p.thisState) {
      inner = <InnerStackNavigator {...innerNavigatorProps} />;
    } else if ("tabs" in p.thisState) {
      inner = <InnerTabNavigator {...innerNavigatorProps} />;
    } else {
      inner = <InnerLeafNavigator {...innerNavigatorProps} />;
    }

    return (
      <RouteInfoProvider path={p.thisPath} currParams={p.thisState.params}>
        {inner}
      </RouteInfoProvider>
    );
  }, dequal);

  function useRawNavigationStateChangeSelector<SelectedVal>(selector: (state: NavigationState<T>) => SelectedVal) {
    const stateStore = deferredDataProm.resolvedValue?.stateStore;
    if (!stateStore) {
      throw new Error("Unable to access state in useMemoizedValueFromState before the first render has occurred");
    }

    const memoizedVal = useRef(useMemo(() => selector(stateStore.get() as NavigationState<T>), []));
    const [__, forceRender] = useReducer((a) => !a, false);

    useEffect(() => {
      let isMounted = true;
      stateStore.subscribe((state) => {
        const newVal = selector(state as NavigationState<T>);
        if (isMounted && !dequal(newVal, memoizedVal.current)) {
          memoizedVal.current = newVal;
          forceRender();
        }
      });

      return () => {
        isMounted = false;
      };
    }, []);

    return memoizedVal.current;
  }

  function subscribeToRawNavigationState(subFn: (state: NavigationState<T>) => void) {
    let unsubFn: undefined | (() => void);

    deferredDataProm.then(({ stateStore }) => {
      subFn(stateStore.get() as any);
      unsubFn = stateStore.subscribe((a: any) => subFn(a));
    });

    return () => {
      unsubFn?.();
    };
  }

  // subscribeToRawNavigationState(s => console.log(JSON.stringify(s, null, 2)));

  function isFocused(state: NavigationState<any>, path: string[]) {
    const focusedPath = extractFocusedPathFromNavigationState(state);
    return focusedPath.indexOf(pathArrToString(path)) === 0;
  }

  function useIsFocused() {
    const { path } = useRouteInfoContext();

    return useRawNavigationStateChangeSelector((s) => isFocused(s, path));
  }

  function useOnFocusChange(fn: (isFocused: boolean) => void) {
    const { path } = useRouteInfoContext({ optional: true }) || {};
    const stateStore = deferredDataProm.resolvedValue?.stateStore;

    if (!stateStore) {
      throw new Error("Unable to access state in useOnFocusChange before the first render has occurred");
    }

    useLayoutEffect(() => {
      if (path) {
        const unsub = stateStore.subscribe((s) => {
          fn(isFocused(s, path));
        });

        return unsub;
      } else {
        return () => {};
      }
    }, [path]);

    return useRawNavigationStateChangeSelector((s) => (path ? isFocused(s, path) : null));
  }

  function useHasEverBeenFocused(path: string[]) {
    const prev = useRef<boolean>(false);

    const val = useRawNavigationStateChangeSelector((s) => {
      const currentlyFocused = isFocused(s, path);
      if (!prev.current && currentlyFocused) {
        return true;
      } else {
        return prev.current;
      }
    });

    useEffect(() => {
      prev.current = val;
    });

    return val;
  }

  function goBack(): boolean {
    if (!deferredDataProm.resolvedValue) {
      throw new Error("Router has not yet mounted! Unable to go back.");
    }
    return goBackInner(deferredDataProm.resolvedValue.stateStore);
  }

  const RootNavigator: Router<T>["Navigator"] = (p) => {
    if (!deferredDataProm.resolvedValue?.stateStore) {
      const gottenInitState = wrapInTryCatch(() => p.getInitialState?.(), "Unable to get initial state");

      const initState = gottenInitState || generateInitialState(rootDef, [""]);

      try {
        deferredNavigationActions.forEach((a) => {
          modifyStateForNavigation({ ...a, currState: initState });
        });
      } catch (e) {
        console.error("Unable to apply initial deferred navigation actions");
        console.error(e);
      }

      const stateStore = createZustandStore(initState);
      const stateSelectorObj = createStateSelectorObj(rootDef, () => stateStore.get());

      deferredDataProm.resolve({
        stateStore,
        stateSelectorObj,
      });
    }

    //Note: We use layout effect b/c it's important to start the subscription to the back handler as soon as possible so
    //that components can subscribe to the BackHandler themselves and override the default behavior if desired
    useLayoutEffect(() => {
      if (Platform.OS === "android") {
        BackHandler.addEventListener("hardwareBackPress", goBack);
      }
      return () => {
        BackHandler.removeEventListener("hardwareBackPress", goBack);
      };
    });

    const state = deferredDataProm.resolvedValue!.stateStore.useStore();

    return (
      <RouteInfoProvider path={[]}>
        <InnerNavigator thisState={state} thisPath={[]} />
      </RouteInfoProvider>
    );
  };

  function getNavigationState(selector?: any) {
    if (!deferredDataProm.resolvedValue) {
      throw new Error("Unable to selectNavigation before the first render has occurred");
    }

    return (
      selector
        ? selector(deferredDataProm.resolvedValue.stateSelectorObj as any)
        : deferredDataProm.resolvedValue.stateStore.get()
    ) as any;
  }

  function useNavigationState(selector?: any) {
    if (!deferredDataProm.resolvedValue) {
      throw new Error("Unable to useNavigationState before the first render has occurred");
    }

    return useRawNavigationStateChangeSelector(() => {
      return selector
        ? selector(deferredDataProm.resolvedValue!.stateSelectorObj as any)
        : deferredDataProm.resolvedValue!.stateStore.get();
    });
  }

  const ret: Router<T> = {
    generateUrl() {
      return "";
    },
    navigateToUrl,
    useIsFocused,
    useOnFocusChange,
    useNavigationState,
    useParams(paramsSelector) {
      const { params: theseParams } = useRouteInfoContext();

      const selectedParams = paramsSelector(paramsObj) as ParamsBase | null;

      if (!selectedParams) {
        throw new Error("Unable to find selected params!");
      }

      Object.keys(selectedParams).forEach((k) => {
        if (!(k in theseParams)) {
          throw new Error("Unable to find parameters!" + Object.keys(selectedParams).toString());
        }
      });

      return theseParams as any;
    },
    Navigator: RootNavigator,
    navigation,
    goBack,
    // manuallyModifyNavigationState: (modifyFn) => {
    //   if (!deferredDataProm.resolvedValue?.stateStore.modifyImmutably) {
    //     throw new Error("Unable to modify state before the first render has occurred!");
    //   }

    //   //TODO: Verify that they don't empty a stack or a tab or do an invalid focusedTabIndex

    //   Keyboard.dismiss();
    //   deferredDataProm.resolvedValue?.stateStore.modifyImmutably((a) => {
    //     modifyFn(a as any);
    //   });
    // },
    getCurrentlyFocusedPath: () => {
      const state = (deferredDataProm.resolvedValue?.stateStore.get() as any) ?? null;

      return state ? extractFocusedPathFromNavigationState(state) : null;
    },
    subscribeToCurrentlyFocusedPath: (subFn) => {
      return subscribeToRawNavigationState((s) => {
        subFn(extractFocusedPathFromNavigationState(s));
      });
    },
  };

  return ret;
}

function invariantFn<T>(val: T, errMsg: string) {
  if (!val || typeof val !== "function") {
    throw new Error(errMsg);
  }

  return val;
}

type InnerNavigatorProps = {
  thisState: NavigationState<any>;
  thisPath: string[];
  rootDef: RouteDef;
  InnerNavigator: InnerNavigator;
  deferredDataProm: DeferredDataProm;
};

function InnerTabNavigator(p: InnerNavigatorProps) {
  if (!("tabs" in p.thisState)) {
    throw new Error("Unable to render TabNavigator with non tab state");
  }

  const Wrapper = getComponentAtPath(p.rootDef, p.thisPath, "wrapper") || React.Fragment;
  const Header = getComponentAtPath(p.rootDef, p.thisPath, "header");
  const TopTabBar = getComponentAtPath(p.rootDef, p.thisPath, "topTabBar");
  const BottomTabBar = getComponentAtPath(p.rootDef, p.thisPath, "bottomTabBar");
  const InnerNavigator = p.InnerNavigator;

  //Gotta do some weird stuff to make the transition smooth and not show a tab too soon (before it has had time to render at least once)
  //Hopefully will be fixed by React Native Screens when this issue gets resolved: https://github.com/software-mansion/react-native-screens/issues/1251
  const focusedTabIndex = p.thisState.focusedTabIndex;
  const prevRawFocusedTabIndex = usePreviousValue(focusedTabIndex);
  const [indexHasMounted, setIndexHasMounted] = useState<Record<number, true>>({});
  const isMountedRef = useIsMountedRef();
  const thisDef = getDefAtPath(p.rootDef, p.thisPath)!;

  return (
    <Wrapper>
      <View style={{ flex: 1 }}>
        {Header ? <Header /> : null}
        {TopTabBar ? <TopTabBar /> : null}
        <ScreenContainer style={{ flex: 1 }}>
          {p.thisState.tabs.map((thisNavigationState, i) => {
            //We have to do some weird shenanigans to work around this issue... https://github.com/software-mansion/react-native-screens/issues/1251
            let activityState: 0 | 1 | 2;
            let zIndex: number;

            if (Platform.OS === "ios") {
              if (i === focusedTabIndex) {
                activityState = indexHasMounted[focusedTabIndex] ? 2 : 1;
                zIndex = indexHasMounted[focusedTabIndex] ? 1 : -1;
              } else if (i === prevRawFocusedTabIndex) {
                activityState = !indexHasMounted[focusedTabIndex] ? 1 : 0;
                zIndex = !indexHasMounted[focusedTabIndex] ? 1 : -1;
              } else {
                activityState = 0;
                zIndex = -1;
              }
            } else {
              activityState = i === focusedTabIndex ? 2 : 0;
              zIndex = i === focusedTabIndex ? 1 : -1;
            }

            const thisRoutePath = p.thisPath.concat(thisNavigationState.path);
            const thisRouteDef = getDefAtPath(p.rootDef, thisRoutePath)!;

            const allScreenProps = {
              ...(thisDef.childScreenProps || {}),
              ...(thisRouteDef.screenProps || {}),
            };
            const {
              screenOrientation,
              activityState: ignoredActivityState,
              onAppear,
              style,
              ...screenProps
            } = allScreenProps;

            return (
              <Screen
                key={i}
                screenOrientation={screenOrientation}
                onAppear={(e) => {
                  if (!indexHasMounted[i]) {
                    isMountedRef.current && setIndexHasMounted((b) => ({ ...b, [i]: true }));
                  }
                  onAppear?.(e);
                }}
                activityState={activityState}
                style={[
                  {
                    ...StyleSheet.absoluteFillObject,
                    backgroundColor: "white",
                    zIndex,
                  },
                  style,
                ]}
                {...screenProps}
              >
                <InnerNavigator thisState={thisNavigationState as any} thisPath={thisRoutePath} />
              </Screen>
            );
          })}
        </ScreenContainer>
        {BottomTabBar ? <BottomTabBar /> : null}
      </View>
    </Wrapper>
  );
}

type InnerNavigator = React.MemoExoticComponent<
  (a: { thisState: NavigationState<any>; thisPath: string[] }) => JSX.Element | null
>;

function InnerStackNavigator(p: InnerNavigatorProps) {
  if (!("stack" in p.thisState)) {
    throw new Error("Unable to render StackNavigator with non stack state");
  }

  //TODO: If has never been focused, return null...;

  const InnerNavigator = p.InnerNavigator;
  const Wrapper = getComponentAtPath(p.rootDef, p.thisPath, "wrapper") || React.Fragment;

  return (
    <Wrapper>
      <ScreenStack style={{ flex: 1 }}>
        {p.thisState.stack.map((thisNavigationState, i) => {
          const Header = getComponentAtPath(p.rootDef, p.thisPath, "header");
          const thisRoutePath = p.thisPath.concat(thisNavigationState.path);
          const thisParentDef = getDefAtPath(p.rootDef, p.thisPath)!;
          const thisRouteDef = getDefAtPath(p.rootDef, thisRoutePath)!;

          const allScreenProps = {
            ...(thisParentDef.childScreenProps || {}),
            ...(thisRouteDef.screenProps || {}),
          };

          const { screenOrientation, style, stackAnimation, onDismissed, stackPresentation, ...screenProps } =
            allScreenProps;

          return (
            <Screen
              key={i}
              screenOrientation={screenOrientation}
              style={[{ ...StyleSheet.absoluteFillObject, backgroundColor: "white" }, style]}
              stackAnimation={stackAnimation ?? Platform.OS === "android" ? "fade" : "slide_from_left"}
              onDismissed={(e) => {
                Keyboard.dismiss();
                p.deferredDataProm.resolvedValue?.stateStore.modifyImmutably((rootState) => {
                  const parentState = getStateAtPath(rootState, p.thisPath);
                  if (!parentState || !("stack" in parentState)) {
                    throw new Error("Unable to clean up state on onDismissed transition!");
                  }

                  parentState.stack.splice(
                    parentState.stack.length - e.nativeEvent.dismissCount,
                    e.nativeEvent.dismissCount,
                  );
                });
                onDismissed?.(e);
              }}
              stackPresentation={stackPresentation ?? Platform.OS === "android" ? "containedTransparentModal" : "push"}
              {...screenProps}
            >
              {Header ? <Header /> : null}
              <View style={{ flex: 1 }}>
                <InnerNavigator thisState={thisNavigationState as any} thisPath={thisRoutePath} />
              </View>
            </Screen>
          );
        })}
      </ScreenStack>
    </Wrapper>
  );
}

function InnerLeafNavigator(p: InnerNavigatorProps) {
  const Leaf = getComponentAtPath(p.rootDef, p.thisPath, "leaf") as any;
  const LeafHeader = Leaf.Header ?? (getComponentAtPath(p.rootDef, p.thisPath, "header") as any);

  if (__DEV__) {
    if (LeafHeader && typeof LeafHeader !== "function") {
      throw new Error(`Header at ${p.thisPath.join("/")} does not return a valid react component!`);
    }
  }
  const Wrapper = getComponentAtPath(p.rootDef, p.thisPath, "wrapper") || React.Fragment;

  if (!Leaf) {
    throw new Error("No component defined on leaf route definition!");
  }

  return (
    <Wrapper>
      {LeafHeader ? <LeafHeader /> : null}
      <View style={{ flex: 1 }}>
        <Leaf />
      </View>
    </Wrapper>
  );
}

function goBackInner(store: ZustandStore<NavigationState<any>>): boolean {
  Keyboard.dismiss();
  return store.modifyImmutably((state) => {
    const focusedPath = extractFocusedStatePathArrFromNavigationState(state);

    const pathToGoBackIndex = _.findLastIndex(focusedPath, (a) => typeof a.path === "number" && a.path !== 0);

    if (pathToGoBackIndex >= 0) {
      const pathToGoBack = focusedPath[pathToGoBackIndex]! as ArrayStatePath;
      const path = focusedPath
        .slice(0, pathToGoBackIndex)
        .map((a) => a.path)
        .filter((a): a is string => typeof a === "string");

      const thisState = getStateAtPath(state, path);

      if (pathToGoBack.type === "stack-array") {
        if (!thisState || !("stack" in thisState) || thisState.stack.length <= 1) {
          throw new Error("Unable to pop stack via goBack! Something wrong has happened.");
        }
        thisState.stack.pop();
      } else {
        if (!thisState || !("tabs" in thisState) || thisState.tabs.length <= 1) {
          throw new Error("Unable to pop stack via goBack! Something wrong has happened.");
        }
        //Initial tab...
        thisState.focusedTabIndex = 0;
      }
    }
  });
}

type ArrayStatePath = { type: "stack-array" | "tab-array"; path: number };
type NavigationStatePath = { type: "leaf" | "tab" | "stack"; path: string };
type StatePath = NavigationStatePath | ArrayStatePath;

function extractFocusedStatePathArrFromNavigationState(state: NavigationState<any>): StatePath[] {
  let path = [] as StatePath[];
  let currState: NavigationState<any> = state;
  while (currState) {
    if ("tabs" in currState) {
      const nextState = currState.tabs[currState.focusedTabIndex];
      if (!nextState) {
        throw new Error("Unable to find focused tab!");
      }

      path.push({ type: "tab", path: currState.path }, { type: "tab-array", path: currState.focusedTabIndex });
      currState = nextState as any;
    } else if ("stack" in currState) {
      const nextState = currState.stack.slice().pop();
      if (!nextState) {
        throw new Error("Unable to determine focused route! Empty stack!");
      }
      path.push({ type: "stack", path: currState.path }, { type: "stack-array", path: currState.stack.length - 1 });
      currState = nextState as any;
    } else {
      path.push({ type: "leaf", path: currState.path });
      currState = null as any;
      break;
    }
  }

  return path;
}

function extractFocusedPathFromNavigationState(state: NavigationState<any>): string {
  const pathArr = extractFocusedStatePathArrFromNavigationState(state);

  return pathArr
    .map((a) => (a.type === "stack-array" || a.type === "tab-array" ? "" : a.path))
    .filter((a) => a)
    .join("/");
}

function pathArrToString(path: string[]) {
  return path.filter((a) => a).join("/");
}

function wrapInTryCatch<T extends () => any>(fn: T, errorMsg: string): ReturnType<T> | null {
  try {
    return fn();
  } catch (e) {
    console.error(errorMsg);
    console.error(e);
    return null;
  }
}

// i18n certified - complete
