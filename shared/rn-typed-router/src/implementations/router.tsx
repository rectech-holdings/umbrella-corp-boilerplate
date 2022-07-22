import { validateAndCleanInputParams, ParamTypesClass, validateAndCleanOutputParams } from "./params.js";
import { PathObjResult, PathObjResultLeaf, UrlString } from "../types/path.js";
import { Router, RouterOptions } from "../types/router.js";
import { RouteDef } from "../types/routes.js";
import queryString from "query-string";
import useEvent from "use-event-callback";
import _ from "lodash";
import React, { createContext, ReactNode, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { BackHandler, Keyboard, Platform, StyleSheet, View } from "react-native";
import {
  InnerNavigationState,
  RootNavigationState,
  StackNavigationState,
  TabNavigationState,
} from "../types/navigationState.js";
import { createZustandStore, ZustandStore } from "../utils/createZustandStore.js";
import { useIsMountedRef } from "../utils/useIsMountedRef.js";
import { usePreviousValue } from "../utils/usePreviousValue.js";
import { Screen, ScreenContainer, ScreenStack } from "react-native-screens";

export function createRouter(rootDefinition: RouteDef, opts: RouterOptions) {
  const thisRouter: Router<any> = new RouterClass(rootDefinition, opts);

  return thisRouter;
}

class RouterClass implements Router<any> {
  private rootDef: RouteDef;

  private getDefAtPath = _.memoize(
    (pathArr: string[]) => {
      let retDef: RouteDef;
      forEachRouteDefUsingPathArray(this.rootDef, pathArr, (def) => {
        retDef = def;
      });
      return retDef!;
    },
    (a) => a.join(""),
  );

  //Returns an object with all the ParamTypes found at the path and the path's parents
  private getAccumulatedParamTypesAtPath = _.memoize(
    (pathArr: string[]): Record<string, any> => {
      const paramTypes: Record<string, ParamTypesClass<any, any, any>> = {};
      forEachRouteDefUsingPathArray(this.rootDef, pathArr, (def) => {
        Object.assign(paramTypes, def.params || {});
      });
      return paramTypes;
    },
    (a) => a.join(""),
  );

  private PATHS_ACCESSOR = Symbol("PATHS_ACCESSOR");
  private getPathArrFromPathObjResult(path: PathObjResult<any, any, any, any, any, any, any, any>) {
    const pathArr: string[] = path[this.PATHS_ACCESSOR];
    if (!pathArr) {
      throw new Error("Invalid path object passed to generateUrl!");
    }
    return pathArr;
  }

  private navigationStateStore: ZustandStore<RootNavigationState<any>>;

  constructor(rootDef: RouteDef, opts: RouterOptions) {
    this.rootDef = rootDef;
    this.navigationStateStore = createZustandStore(
      opts.initialNavigationState || this.generateInitialRootState(rootDef),
    );
  }

  private generateInitialRootState(rootDef: RouteDef): RootNavigationState<any> {
    if (!("routes" in rootDef) || !rootDef.routes) {
      throw new Error();
    }

    const initialRoute = rootDef.initialRoute || Object.keys(rootDef.routes)[0]!;
    const initialInnerState = this.generateInitialInnerState(rootDef.routes[initialRoute]!, initialRoute);

    if (rootDef.type === "stack") {
      return {
        type: "root-stack",
        stack: [initialInnerState],
      };
    } else if (rootDef.type === "switch" || rootDef.type === "tab") {
      return {
        type: rootDef.type === "tab" ? "root-tab" : "root-switch",
        focusedTabIndex: 0,
        tabs: [initialInnerState],
      };
    } else {
      ((a: never) => {})(rootDef.type);
      throw new Error("Unreachable");
    }
  }

  private generateInitialInnerState(def: RouteDef, path: string, params?: Record<string, any>): InnerNavigationState {
    if (def.type === "leaf") {
      return {
        type: "leaf",
        path,
        params,
      };
    } else if ("routes" in def) {
      const initialRoute = def.initialRoute || Object.keys(def.routes)[0]!;
      const initialInnerState = this.generateInitialInnerState(def.routes[initialRoute]!, initialRoute);

      if (def.type == "stack") {
        return {
          type: "stack",
          path,
          params,
          stack: [initialInnerState],
        };
      } else {
        return {
          type: (def.type === "tab" ? "tab" : "switch") as any,
          path,
          params,
          focusedTabIndex: 0,
          tabs: [initialInnerState],
        };
      }
    } else {
      ((a: never) => {})(def);
      throw new Error("Unreachable");
    }
  }

  private getComponentAtPath(path: string[], type: "leaf" | "topTabBar" | "bottomTabBar" | "header" | "wrapper"): any {
    const childDef = this.getDefAtPath(path);

    let Component: any;
    if (type === "leaf") {
      if ("Component" in childDef) {
        Component = assertIsFn(childDef.Component, "component was defined on a route but is not a react component");
      } else if ("getComponent" in childDef) {
        Component = assertIsFn(
          childDef.getComponent(),
          "getComponent was defined on route but does not return a react component! " + path.join("/"),
        );
      }
    } else if (type === "bottomTabBar") {
      if ("BottomTabBar" in childDef) {
        Component = assertIsFn(
          childDef.BottomTabBar,
          "bottomTabBar was defined on route but is not a react component! " + path.join("/"),
        );
      } else if ("getBottomTabBar" in childDef) {
        Component = assertIsFn(
          childDef.getBottomTabBar?.(),
          "getBottomTabBar was defined on route but does not return a react component! " + path.join("/"),
        );
      }
    } else if (type === "topTabBar") {
      if ("TopTabBar" in childDef) {
        Component = assertIsFn(
          childDef.TopTabBar,
          "topTabBar was defined on route but is not a react component! " + path.join("/"),
        );
      } else if ("getTopTabBar" in childDef) {
        Component = assertIsFn(
          childDef.getTopTabBar?.(),
          "getTopTabBar was defined on route but does not return a react component",
        );
      }
    } else if (type === "wrapper") {
      if (childDef.getWrapper) {
        Component = assertIsFn(
          childDef.getWrapper?.(),
          "getWrapper was defined on route but does not return a react component! " + path.join("/"),
        );
      } else if (childDef.Wrapper) {
        Component = assertIsFn(
          childDef.Wrapper,
          "Wrapper was defined on a route but is not a react component! " + path.join("/"),
        );
      }
    } else {
      if (childDef.getHeader) {
        Component = assertIsFn(
          childDef.getHeader?.(),
          "getHeader was defined on route but does not return a react component! " + path.join("/"),
        );
      } else if (childDef.Header) {
        Component = assertIsFn(
          childDef.Header,
          "header was defined on a route but is not a react component! " + path.join("/"),
        );
      }
    }

    if (!Component) {
      throw new Error(`Unable to find ${type} component at path ${path.join("/")}`);
    }

    return Component;
  }

  private getFocusedAbsoluteNavStatePath() {
    const rootState = this.navigationStateStore.get();
    let path: (number | string)[] = [];
    let currState: RootNavigationState<any> | InnerNavigationState = rootState;
    while (currState) {
      if ("tabs" in currState) {
        const nextState = currState.tabs[currState.focusedTabIndex]!;
        if (!nextState) {
          throw new Error("Unable to find focused tab!");
        }

        path.push("tabs", currState.focusedTabIndex, nextState.path);
        currState = nextState as any;
      } else if ("stack" in currState) {
        const focusedIndex = currState.stack.length - 1;
        const nextState = currState.stack[focusedIndex];
        if (!nextState) {
          throw new Error("Unable to determine focused route! Empty stack!");
        }
        path.push("stack", focusedIndex, nextState.path);
        currState = nextState as any;
      } else if (currState.type === "leaf") {
        break;
      } else {
        ((a: never) => {})(currState);
        throw new Error("Unreachable");
      }
    }

    return path;
  }

  private useAbsoluteNavStatePathHasEverBeenFocused = (absoluteNavStatePath: (string | number)[]) => {
    const hasEverBeenFocused = useRef(false);
    return this.navigationStateStore.useStore(() => {
      //A bit gross to do a side effect in a selector, but it's the best place for the side effect
      if (_.isEqual(this.getFocusedAbsoluteNavStatePath(), absoluteNavStatePath)) {
        hasEverBeenFocused.current = true;
      }
      return hasEverBeenFocused.current;
    });
  };

  //NOTE: This is the root navigator
  public Navigator = () => {
    //Note: We use layout effect b/c it's important to start the subscription to the back handler as soon as possible so
    //that components can subscribe to the BackHandler themselves and override the default behavior if desired
    useLayoutEffect(() => {
      if (Platform.OS === "android") {
        BackHandler.addEventListener("hardwareBackPress", this.goBack);
      }
      return () => {
        BackHandler.removeEventListener("hardwareBackPress", this.goBack);
      };
    });

    const navState = this.navigationStateStore.useStore();

    const routeStateArr = navState.type === "root-stack" ? navState.stack : navState.tabs;
    const stackOrTabsStr = navState.type === "root-stack" ? "stack" : "tabs";

    return (
      <>
        {routeStateArr.map((s, i) => {
          return <this.InnerNavigator state={s} path={[s.path]} absoluteNavStatePath={[stackOrTabsStr, i, s.path]} />;
        })}
      </>
    );
  };

  private AbsoluteNavStatePathContext = createContext<(string | number)[]>([]);
  private useAbsoluteNavStatePath = () => useContext(this.AbsoluteNavStatePathContext);

  private InnerNavigator = (p: {
    state: InnerNavigationState;
    path: string[];
    absoluteNavStatePath: (string | number)[];
  }) => {
    if (!this.useAbsoluteNavStatePathHasEverBeenFocused(p.absoluteNavStatePath)) {
      return null;
    }

    let inner: any;

    if (p.state.type === "leaf") {
      inner = <this.InnerLeafNavigator path={p.path} />;
    } else if (p.state.type === "tab" || p.state.type === "switch") {
      inner = (
        <this.InnerTabNavigator path={p.path} absoluteNavStatePath={p.absoluteNavStatePath} state={p.state as any} />
      );
    } else if (p.state.type === "stack") {
      inner = (
        <this.InnerStackNavigator path={p.path} absoluteNavStatePath={p.absoluteNavStatePath} state={p.state as any} />
      );
    } else {
      ((a: never) => {})(p.state.type);
      throw new Error("Unreachable");
    }

    return (
      <this.AbsoluteNavStatePathContext.Provider value={p.absoluteNavStatePath}>
        {inner}
      </this.AbsoluteNavStatePathContext.Provider>
    );
  };

  private InnerLeafNavigator = React.memo((p: { path: string[] }) => {
    const Leaf = this.getComponentAtPath(p.path, "leaf") as any;
    const LeafHeader = Leaf.Header ?? (this.getComponentAtPath(p.path, "header") as any);

    if (__DEV__) {
      if (LeafHeader && typeof LeafHeader !== "function") {
        throw new Error(`Header at ${p.path.join("/")} does not return a valid react component!`);
      }
    }
    const Wrapper = this.getComponentAtPath(p.path, "wrapper") || React.Fragment;

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
  });

  private InnerStackNavigator = React.memo(
    (p: { path: string[]; state: StackNavigationState<any, any, any>; absoluteNavStatePath: (string | number)[] }) => {
      const Wrapper = this.getComponentAtPath(p.path, "wrapper") || React.Fragment;

      const parentDef = this.getDefAtPath(p.path)!;

      return (
        <Wrapper>
          <ScreenStack style={{ flex: 1 }}>
            {p.state.stack.map((thisNavigationState, i) => {
              const Header = this.getComponentAtPath(p.path, "header");
              const thisRoutePath = p.path.concat(thisNavigationState.path);
              const thisRouteDef = this.getDefAtPath(thisRoutePath)!;

              const allScreenProps = {
                ...(parentDef.childScreenProps || {}),
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
                    this.navigationStateStore.modifyImmutably((rootState) => {
                      const parentState = _.get(rootState, p.absoluteNavStatePath);
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
                  stackPresentation={
                    stackPresentation ?? Platform.OS === "android" ? "containedTransparentModal" : "push"
                  }
                  {...screenProps}
                >
                  {Header ? <Header /> : null}
                  <View style={{ flex: 1 }}>
                    <this.InnerNavigator
                      state={thisNavigationState as any}
                      path={thisRoutePath}
                      absoluteNavStatePath={p.absoluteNavStatePath.concat("stack", i, thisNavigationState.path)}
                    />
                  </View>
                </Screen>
              );
            })}
          </ScreenStack>
        </Wrapper>
      );
    },
  );

  private InnerTabNavigator = React.memo(
    (p: { path: string[]; state: TabNavigationState<any, any, any>; absoluteNavStatePath: (string | number)[] }) => {
      const Wrapper = (this.getComponentAtPath(p.path, "wrapper") || React.Fragment) as any;
      const Header = this.getComponentAtPath(p.path, "header");
      const TopTabBar = this.getComponentAtPath(p.path, "topTabBar");
      const BottomTabBar = this.getComponentAtPath(p.path, "bottomTabBar");

      //Gotta do some weird shenanigans to make the transition smooth and not show a tab too soon (before it has had time to render at least once)
      //Hopefully will be fixed by React Native Screens when this issue gets resolved: https://github.com/software-mansion/react-native-screens/issues/1251
      const focusedTabIndex = p.state.focusedTabIndex;
      const prevRawFocusedTabIndex = usePreviousValue(focusedTabIndex);
      const [indexHasMounted, setIndexHasMounted] = useState<Record<number, true>>({});
      const isMountedRef = useIsMountedRef();
      const thisDef = this.getDefAtPath(p.path)!;

      return (
        <Wrapper>
          <View style={{ flex: 1 }}>
            {Header ? <Header /> : null}
            {TopTabBar ? <TopTabBar /> : null}
            <ScreenContainer style={{ flex: 1 }}>
              {p.state.tabs.map((thisNavigationState, i) => {
                //Here come the weird shenanigans...
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

                const thisRoutePath = p.path.concat(thisNavigationState.path);
                const thisRouteDef = this.getDefAtPath(thisRoutePath);

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
                    <this.InnerNavigator
                      state={thisNavigationState as any}
                      path={thisRoutePath}
                      absoluteNavStatePath={p.absoluteNavStatePath.concat("tabs", i, thisNavigationState.path)}
                    />
                  </Screen>
                );
              })}
            </ScreenContainer>
            {BottomTabBar ? <BottomTabBar /> : null}
          </View>
        </Wrapper>
      );
    },
  );

  public PATHS = (() => {
    const createProxyObj = (parentPaths: string[] = []): any =>
      new Proxy(
        {},
        {
          set: () => false,
          get: (__, propKey) => {
            if (propKey === this.PATHS_ACCESSOR) {
              return parentPaths;
            } else {
              parentPaths.push(propKey as string);
              return createProxyObj(parentPaths);
            }
          },
        },
      );

    return createProxyObj();
  })();

  private generateUrlFromPathArr(pathArr: string[], inputParams: Record<string, any>) {
    const paramTypes = this.getAccumulatedParamTypesAtPath(pathArr);

    const cleanedParams = validateAndCleanInputParams(inputParams, paramTypes);

    const queryStr = Object.keys(cleanedParams).length
      ? `?${queryString.stringify(cleanedParams, { skipNull: true, skipEmptyString: true })}`
      : "";

    const pathStr = pathArr.join("/");

    return (pathStr + queryStr) as UrlString;
  }

  public generateUrl = (
    path: PathObjResultLeaf<any, any, any, any, any, any, any, any>,
    inputParams: Record<string, any>,
  ): UrlString => {
    const pathArr = this.getPathArrFromPathObjResult(path);
    return this.generateUrlFromPathArr(pathArr, inputParams);
  };

  assertPathConstraintIsSatisfied = (
    pathConstraint: PathObjResult<any, any, any, any, any, any, any, any>,
    path: string[],
  ) => {
    const pathArr = this.getPathArrFromPathObjResult(pathConstraint);
  };

  private useAssertPathConstraintIsSatisfied = (
    pathConstraint: PathObjResult<any, any, any, any, any, any, any, any>,
  ) => {
    const absNavStatePath = this.useAbsoluteNavStatePath();
    const path = absoluteNavStatePathToRegularPath(absNavStatePath);
    return this.assertPathConstraintIsSatisfied(pathConstraint, path);
  };

  public useParams = (
    pathConstraint: PathObjResult<any, any, any, any, any, any, any, any>,
    selector?: (a: Record<string, any>) => any,
  ) => {
    this.useAssertPathConstraintIsSatisfied(pathConstraint);
    const constraintPath = this.getPathArrFromPathObjResult(pathConstraint);
    const componentAbsPath = this.useAbsoluteNavStatePath();
    const componentPath = absoluteNavStatePathToRegularPath(componentAbsPath);

    if (_.isEqual(componentPath, constraintPath)) {
      throw new Error(`Cannot find params at path ${constraintPath}!`);
    }

    return this.navigationStateStore.useStore(() => {
      const params = this.getParamsAtAbsoluteNavStatePath(componentAbsPath);

      return selector ? selector(params) : params;
    });
  };

  private getParamsAtAbsoluteNavStatePath(navStatePath: (number | string)[]) {
    const rootState = this.navigationStateStore.get();
    const regularPath = absoluteNavStatePathToRegularPath(navStatePath);
    const accumulatedParams: Record<string, any> = {};
    navStatePath.forEach((__, i) => {
      if ((i + 1) % 3 === 0) {
        const val: InnerNavigationState = _.get(rootState, navStatePath.slice(0, i + 1));
        if ("params" in val) {
          const theseParamTypes = this.getDefAtPath(regularPath).params;
          if (!theseParamTypes) {
            throw new Error("No param types found for route! " + regularPath);
          }
          const theseParams = validateAndCleanOutputParams(theseParamTypes, val.params || {});

          Object.assign(accumulatedParams, theseParams);
        }
      }
    });

    return accumulatedParams;
  }

  public getFocusedParams() {
    return this.getParamsAtAbsoluteNavStatePath(this.getFocusedAbsoluteNavStatePath());
  }

  public useIsFocused = () => {
    const thisAbsPath = this.useAbsoluteNavStatePath();
    return this.navigationStateStore.useStore(() => {
      return _.isEqual(thisAbsPath, this.getFocusedAbsoluteNavStatePath());
    });
  };

  public useFocusEffect = (fn: (isFocused: boolean) => any) => {
    const thisAbsPath = this.useAbsoluteNavStatePath();

    const onFocus = useEvent(() => fn(_.isEqual(thisAbsPath, this.getFocusedAbsoluteNavStatePath())));

    useEffect(() => {
      return this.navigationStateStore.subscribe(onFocus);
    }, []);
  };

  public getFocusedUrl() {
    const absPath = this.getFocusedAbsoluteNavStatePath();
    const path = absoluteNavStatePathToRegularPath(absPath);
    const params = this.getFocusedParams();

    return this.generateUrlFromPathArr(path, params);
  }

  public subscribeToFocusedUrl = (fn: (url: string) => void) => {
    let currFocusedUrl: string;
    return this.navigationStateStore.subscribe(() => {
      const newFocusedUrl = this.getFocusedUrl();
      if (newFocusedUrl !== currFocusedUrl) {
        currFocusedUrl = newFocusedUrl;
        fn(currFocusedUrl);
      }
    });
  };

  public useFocusedUrl = (selector?: (url: string) => any) => {
    return this.navigationStateStore.useStore(() => {
      const focusedUrl = this.getFocusedUrl();
      return selector ? selector(focusedUrl) : focusedUrl;
    });
  };

  public goBack: any;

  public navigate: any;

  public reset: any;

  public navigateToUrl: any;
}

/**
 * Iterates through the route definition with the given path, calling `process` for each route definition from root to leaf
 */
function forEachRouteDefUsingPathArray(rootDef: RouteDef, pathArr: string[], processFn: (val: RouteDef) => void) {
  if (!pathArr.length && __DEV__) {
    throw new Error("Unable to traverse empty path array!");
  }

  processFn(rootDef);

  let currDef: RouteDef = rootDef;
  const arr = [...pathArr];
  while (arr.length) {
    const route = arr.shift();
    if (route && "routes" in currDef && currDef.routes[route as any]) {
      currDef = currDef.routes[route as any] as any;
    } else {
      throw new Error(`Unable to find route definitition ${route} for the path ${pathArr.join("/")}`);
    }
    processFn(currDef);
  }
}

function assertIsFn<T>(val: T, errMsg: string) {
  if (!val || typeof val !== "function") {
    throw new Error(errMsg);
  }

  return val;
}

function absoluteNavStatePathToRegularPath(absNavStatePath: (string | number)[]) {
  //Absolute nav state paths are always in pairs of 3. E.g. "tabs" -> 0 -> "someRouteName"
  return _.filter(absNavStatePath, (a, i) => (i + 1) % 3 === 0) as string[];
}
