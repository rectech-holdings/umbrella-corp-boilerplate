import { validateAndCleanInputParams, ParamTypesClass } from "./params.js";
import { PathObjResult, PathObjResultLeaf, UrlString } from "../types/path.js";
import { Router, RouterOptions } from "../types/router.js";
import { MultiTypeComponent, RouteDef, StackRouteDef, SwitchRouteDef } from "../types/routes.js";
import { dequal } from "dequal/lite";
import urlParse from "url-parse";
import useEvent from "use-event-callback";
import _ from "lodash";
import React, {
  createContext,
  ReactNode,
  Suspense,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  AbsNavStatePath,
  InnerNavigationState,
  NavigateOptions,
  RootNavigationState,
  StackNavigationState,
  SwitchNavigationState,
} from "../types/navigationState.js";
import queryString from "query-string";
import { createZustandStore, ZustandStore } from "../utils/createZustandStore.js";
import { useIsMountedRef } from "../utils/useIsMountedRef.js";
import { usePreviousValue } from "../utils/usePreviousValue.js";
import { BackHandler, Keyboard, Platform, Screen, ScreenContainer, ScreenStack, StyleSheet, View } from "./primitives";
import { Freeze } from "../utils/react-freeze.js";

const defaultWrapperStyle = Platform.OS === "web" ? {} : { flex: 1 };

export function createRouter<T extends RouteDef>(rootDefinition: T, opts?: RouterOptions): Router<T> {
  const thisRouter: Router<any> = new RouterClass(rootDefinition, opts);

  return thisRouter as any as Router<T>;
}

class RouterClass implements Router<any> {
  #rootDef: RouteDef;

  #getDefAtPath = _.memoize(
    (pathArr: string[]) => {
      let retDef: RouteDef;
      forEachRouteDefUsingPathArray(this.#rootDef, pathArr, (def, route) => {
        if (!def) {
          throw new Error(`Unable to find route definitition ${route} for the path ${pathArr.join("/")}`);
        }
        retDef = def;
      });
      return retDef!;
    },
    (a) => a.join(""),
  );

  //Returns an object with all the ParamTypes found at the path and the path's parents
  #getAccumulatedParamTypesAtPath = _.memoize(
    (pathArr: string[], throwOnNotFound: boolean): Record<string, any> => {
      const paramTypes: Record<string, ParamTypesClass<any, any, any>> = {};
      forEachRouteDefUsingPathArray(this.#rootDef, pathArr, (def, route) => {
        if (!def) {
          if (throwOnNotFound) {
            throw new Error(`Unable to find route definitition ${route} for the path ${pathArr.join("/")}`);
          }
        } else {
          Object.assign(paramTypes, def.params || {});
        }
      });

      return paramTypes;
    },
    (a) => a.join(""),
  );

  #PATHS_ACCESSOR = Symbol.for("PATHS_ACCESSOR");
  #getPathArrFromPathObjResult(path: PathObjResult<any, any, any, any, any, any, any, any>) {
    const pathArr: string[] = path[this.#PATHS_ACCESSOR];
    if (!pathArr) {
      throw new Error("Invalid path object passed to generateUrl!");
    }
    return pathArr;
  }

  #navigationStateStore: ZustandStore<RootNavigationState<any>>;

  constructor(rootDef: RouteDef, opts?: RouterOptions) {
    this.#rootDef = rootDef;
    this.#navigationStateStore = createZustandStore(
      opts?.initialNavigationState || this.#generateInitialRootState(rootDef),
    );
  }

  #generateInitialRootState(rootDef: RouteDef): RootNavigationState<any> {
    if (!("routes" in rootDef) || !rootDef.routes) {
      throw new Error("The root of your route definition must be a switch or stack navigator!");
    }

    const initialRoute = rootDef.initialRoute || Object.keys(rootDef.routes)[0]!;
    const initialInnerState = this.#generateInitialInnerState(rootDef.routes[initialRoute]!, initialRoute);

    if (rootDef.type === "stack") {
      return {
        type: "root-stack",
        stack: [initialInnerState],
      };
    } else if (rootDef.type === "switch") {
      return {
        type: "root-switch",
        focusedSwitchIndex: 0,
        switches: [initialInnerState],
      };
    } else {
      ((a: never) => {})(rootDef);
      throw new Error("Unreachable");
    }
  }

  #generateInitialInnerState(
    def: RouteDef,
    path: string,
    allAccumulatedParams?: Record<string, any>,
  ): InnerNavigationState {
    const params = def.params ? _.pick(allAccumulatedParams, Object.keys(def.params)) : undefined;

    if (def.type === "leaf") {
      return {
        type: "leaf",
        path,
        params,
      };
    } else if ("routes" in def) {
      const initialRoute = def.initialRoute || Object.keys(def.routes)[0]!;
      const initialInnerState = this.#generateInitialInnerState(
        def.routes[initialRoute]!,
        initialRoute,
        allAccumulatedParams,
      );

      if (def.type == "stack") {
        return {
          type: "stack",
          path,
          params,
          stack: [initialInnerState],
        };
      } else if (def.type === "switch") {
        return {
          type: "switch",
          path,
          params,
          focusedSwitchIndex: 0,
          switches: [initialInnerState],
        };
      } else {
        ((a: never) => {})(def);
        throw new Error("Unreachable");
      }
    } else {
      ((a: never) => {})(def);
      throw new Error("Unreachable");
    }
  }

  #getComponentAtPath(
    path: string[],
    type: "leaf" | "footer" | "header",
  ): { (): JSX.Element; Header?: () => JSX.Element } | null;
  #getComponentAtPath(path: string[], type: "wrapper"): ((a: { children: ReactNode }) => JSX.Element) | null;
  #getComponentAtPath(path: string[], type: "leaf" | "footer" | "header" | "wrapper"): any {
    const childDef = this.#getDefAtPath(path);

    let Component: any;
    if (type === "leaf") {
      if ("Component" in childDef && childDef.Component) {
        Component = assertIsComponent(
          childDef.Component,
          "component was defined on a route but is not a react component!" + path.join("/"),
        );
      }
    } else if (type === "footer") {
      if ("Footer" in childDef && childDef.Footer) {
        Component = assertIsComponent(
          childDef.Footer,
          "Footer was defined on route but is not a react component! " + path.join("/"),
        );
      }
    } else if (type === "wrapper") {
      if (childDef.Wrapper) {
        Component = assertIsComponent(
          childDef.Wrapper,
          "Wrapper was defined on a route but is not a react component! " + path.join("/"),
        );
      }
    } else if (type === "header") {
      if (childDef.Header) {
        Component = assertIsComponent(
          childDef.Header,
          "header was defined on a route but is not a react component! " + path.join("/"),
        );
      }
    }

    return Component;
  }

  #getFocusedAbsoluteNavStatePath() {
    const rootState = this.#navigationStateStore.get();
    let path: AbsNavStatePath = [];
    let currState: RootNavigationState<any> | InnerNavigationState = rootState;
    while (currState) {
      if ("switches" in currState) {
        const nextState = currState.switches[currState.focusedSwitchIndex]!;
        if (!nextState) {
          throw new Error("Unable to find focused switch!");
        }

        path.push("switches", currState.focusedSwitchIndex, nextState.path);
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

  #useAbsoluteNavStatePathHasEverBeenFocused = (absoluteNavStatePath: (string | number)[]) => {
    const hasEverBeenFocused = useRef(absoluteNavStatePath.length ? false : true);
    return this.#navigationStateStore.useStore(() => {
      //A bit gross to do a side effect in a selector, but it's the best place for the side effect
      if (pathSatisfiesPathConstraint(absoluteNavStatePath, this.#getFocusedAbsoluteNavStatePath())) {
        hasEverBeenFocused.current = true;
      }
      return hasEverBeenFocused.current;
    });
  };

  #useRootBackHandler = () => {
    //Note: We setup the back handler subscription lazily in render b/c it's important to start the subscription to the back handler as soon as possible so
    //that components can subscribe to the BackHandler themselves and override the default behavior if desired

    const hasSetup = useRef(false);
    const rootGoBack = useRef(() => this.goBack());

    if (!hasSetup.current && Platform.OS === "android") {
      BackHandler.addEventListener("hardwareBackPress", rootGoBack.current);
      hasSetup.current = true;
    }

    useEffect(() => {
      const goBackUnsub = rootGoBack.current;
      return () => {
        BackHandler.removeEventListener("hardwareBackPress", goBackUnsub);
      };
    }, []);
  };

  //NOTE: This is the root navigator
  public Navigator = () => {
    const navState = this.#navigationStateStore.useStore();
    const InnerNavigator = this.#InnerNavigator;
    this.#useRootBackHandler();

    return <InnerNavigator state={navState} path={[]} absoluteNavStatePath={[]} />;
  };

  #AbsoluteNavStatePathContext = createContext<(string | number)[]>([]);
  #useAbsoluteNavStatePath = () => useContext(this.#AbsoluteNavStatePathContext);

  #InnerNavigator = (p: {
    state: InnerNavigationState | RootNavigationState<any>;
    path: string[];
    absoluteNavStatePath: (string | number)[];
  }) => {
    const hasEverBeenFocused = this.#useAbsoluteNavStatePathHasEverBeenFocused(p.absoluteNavStatePath);
    const isFocused = this.useIsFocused(p.absoluteNavStatePath);

    if (!hasEverBeenFocused) {
      return null;
    }

    let inner: any;

    const InnerLeafNavigator = this.#InnerLeafNavigator;
    const InnerSwitchNavigator = this.#InnerSwitchNavigator;
    const InnerStackNavigator = this.#InnerStackNavigator;

    if (p.state.type === "leaf") {
      inner = <InnerLeafNavigator path={p.path} />;
    } else if (p.state.type === "switch" || p.state.type === "root-switch") {
      inner = (
        <InnerSwitchNavigator path={p.path} absoluteNavStatePath={p.absoluteNavStatePath} state={p.state as any} />
      );
    } else if (p.state.type === "stack" || p.state.type === "root-stack") {
      inner = (
        <InnerStackNavigator path={p.path} absoluteNavStatePath={p.absoluteNavStatePath} state={p.state as any} />
      );
    } else {
      ((a: never) => {})(p.state);
      throw new Error("Unreachable");
    }

    const Provider = this.#AbsoluteNavStatePathContext.Provider;

    return (
      <Freeze freeze={!isFocused}>
        <Provider value={p.absoluteNavStatePath}>{inner}</Provider>
      </Freeze>
    );
  };

  #InnerLeafNavigator = React.memo((p: { path: string[] }) => {
    const Leaf = this.#getComponentAtPath(p.path, "leaf");
    const LeafHeader = Leaf?.Header ?? this.#getComponentAtPath(p.path, "header");

    if (process.env["NODE_ENV"] === "development") {
      if (LeafHeader && typeof LeafHeader !== "function") {
        throw new Error(`Header at ${p.path.join("/")} does not return a valid react component!`);
      }
    }
    const Wrapper = this.#getComponentAtPath(p.path, "wrapper") || React.Fragment;

    if (!Leaf) {
      throw new Error("No component defined on leaf route definition!");
    }

    return (
      <Wrapper>
        {LeafHeader ? <LeafHeader /> : null}
        <View style={defaultWrapperStyle}>
          <Leaf />
        </View>
      </Wrapper>
    );
  }, dequal);

  #InnerStackNavigator = React.memo(
    (p: { path: string[]; state: StackNavigationState<any, any, any>; absoluteNavStatePath: (string | number)[] }) => {
      const Wrapper = this.#getComponentAtPath(p.path, "wrapper") || React.Fragment;

      const parentDef = this.#getDefAtPath(p.path)! as StackRouteDef;

      const InnerNavigator = this.#InnerNavigator;

      return (
        <Wrapper>
          <ScreenStack style={defaultWrapperStyle}>
            {p.state.stack.map((thisNavigationState, i) => {
              const Header = this.#getComponentAtPath(p.path, "header");
              const thisRoutePath = p.path.concat(thisNavigationState.path);
              const thisRouteDef = this.#getDefAtPath(thisRoutePath)!;
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
                  stackAnimation={
                    stackAnimation ? stackAnimation : Platform.OS === "android" ? "fade" : "slide_from_left"
                  }
                  stackPresentation={
                    stackPresentation
                      ? stackPresentation
                      : Platform.OS === "android"
                      ? "containedTransparentModal"
                      : "push"
                  }
                  onDismissed={(e) => {
                    Keyboard.dismiss();
                    this.#navigationStateStore.modifyImmutably((rootState) => {
                      const parentState = getStateAtAbsPath(rootState, p.absoluteNavStatePath);
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
                  {...screenProps}
                >
                  {Header ? <Header /> : null}
                  <View style={defaultWrapperStyle}>
                    <InnerNavigator
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
    dequal,
  );

  #InnerSwitchNavigator = React.memo(
    (p: { path: string[]; state: SwitchNavigationState<any, any, any>; absoluteNavStatePath: (string | number)[] }) => {
      const Wrapper = this.#getComponentAtPath(p.path, "wrapper") || React.Fragment;
      const Header = this.#getComponentAtPath(p.path, "header");
      const Footer = this.#getComponentAtPath(p.path, "footer");

      //Gotta do some weird shenanigans to make the transition smooth and not show a switch page too soon (before it has had time to render at least once)
      //Hopefully will be fixed by React Native Screens when this issue gets resolved: https://github.com/software-mansion/react-native-screens/issues/1251
      const focusedSwitchIndex = p.state.focusedSwitchIndex;
      const prevRawFocusedSwitchIndex = usePreviousValue(focusedSwitchIndex);
      const [indexHasMounted, setIndexHasMounted] = useState<Record<number, true>>({});
      const isMountedRef = useIsMountedRef();
      const parentDef = this.#getDefAtPath(p.path)! as SwitchRouteDef;

      const InnerNavigator = this.#InnerNavigator;

      return (
        <Wrapper>
          <View style={defaultWrapperStyle}>
            {Header ? <Header /> : null}
            <ScreenContainer style={defaultWrapperStyle}>
              {p.state.switches.map((thisNavigationState, i) => {
                if (parentDef.keepChildrenMounted !== true && i !== focusedSwitchIndex) {
                  return null;
                }

                //Here come the weird shenanigans...
                let activityState: 0 | 1 | 2;
                let zIndex: number;

                if (Platform.OS === "ios") {
                  if (i === focusedSwitchIndex) {
                    activityState = indexHasMounted[focusedSwitchIndex] ? 2 : 1;
                    zIndex = indexHasMounted[focusedSwitchIndex] ? 1 : -1;
                  } else if (i === prevRawFocusedSwitchIndex) {
                    activityState = !indexHasMounted[focusedSwitchIndex] ? 1 : 0;
                    zIndex = !indexHasMounted[focusedSwitchIndex] ? 1 : -1;
                  } else {
                    activityState = 0;
                    zIndex = -1;
                  }
                } else {
                  activityState = i === focusedSwitchIndex ? 2 : 0;
                  zIndex = i === focusedSwitchIndex ? 1 : -1;
                }

                const thisRoutePath = p.path.concat(thisNavigationState.path);
                const thisRouteDef = this.#getDefAtPath(thisRoutePath);

                const allScreenProps = {
                  ...(parentDef.childScreenProps || {}),
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
                    <InnerNavigator
                      state={thisNavigationState as any}
                      path={thisRoutePath}
                      absoluteNavStatePath={p.absoluteNavStatePath.concat("switches", i, thisNavigationState.path)}
                    />
                  </Screen>
                );
              })}
            </ScreenContainer>
            {Footer ? <Footer /> : null}
          </View>
        </Wrapper>
      );
    },
    dequal,
  );

  public PATHS = (() => {
    const createProxyObj = (parentPaths: string[]): any =>
      new Proxy(
        {},
        {
          set: () => false,
          get: (__, propKey) => {
            if (propKey === this.#PATHS_ACCESSOR) {
              return parentPaths;
            } else {
              parentPaths.push(propKey as string);
              return createProxyObj(parentPaths);
            }
          },
        },
      );

    return new Proxy(
      {},
      {
        get(__, propKey) {
          return createProxyObj([propKey as string]);
        },
      },
    ) as any;
  })();

  #generateUrlFromPathArr(pathArr: string[], inputParams: Record<string, any>) {
    const paramTypes = this.#getAccumulatedParamTypesAtPath(pathArr, true);

    const pr = validateAndCleanInputParams(inputParams, paramTypes);

    if (!pr.isValid) {
      throw new Error(pr.errors.join("\n"));
    }

    const { params: cleanedParams } = pr;

    const queryStr = Object.keys(cleanedParams).length
      ? `?${queryString.stringify(cleanedParams, { skipNull: true, skipEmptyString: true })}`
      : "";

    const pathStr = pathArr.join("/");

    return (pathStr + queryStr) as UrlString;
  }

  public validateUrl = (url: string) => {
    const { path, params } = parseUrl(url);

    const errors: string[] = [];

    forEachRouteDefUsingPathArray(this.#rootDef, path, (def, route) => {
      if (!def) {
        errors.push(`Unable to find route ${route} for the url path ${path.join("/")}`);
      }
    });

    const pr = validateAndCleanInputParams(params, this.#getAccumulatedParamTypesAtPath(path, false));

    if (!pr.isValid) {
      errors.push(...pr.errors);
    }

    return errors.length ? { isValid: false, errors } : { isValid: true as const };
  };

  public generateUrl = (
    path: PathObjResultLeaf<any, any, any, any, any, any, any, any>,
    inputParams: Record<string, any>,
  ): UrlString => {
    const pathArr = this.#getPathArrFromPathObjResult(path);
    return this.#generateUrlFromPathArr(pathArr, inputParams);
  };

  #assertPathConstraintIsSatisfied = (
    pathConstraint: PathObjResult<any, any, any, any, any, any, any, any>,
    path: string[],
  ) => {
    const constraintPathStr = this.#getPathArrFromPathObjResult(pathConstraint).join("/");
    const pathStr = path.join("/");
    if (pathStr !== constraintPathStr) {
      throw new Error(
        `Invalid path accessed! The path ${pathStr} does not satisfy the required path ${constraintPathStr}`,
      );
    }
  };

  public useParams = (
    pathConstraint: PathObjResult<any, any, any, any, any, any, any, any>,
    selector?: (a: Record<string, any>) => any,
  ) => {
    const constraintPath = this.#getPathArrFromPathObjResult(pathConstraint);
    const componentAbsPath = this.#useAbsoluteNavStatePath();
    const componentPath = absoluteNavStatePathToRegularPath(componentAbsPath);

    if (!pathSatisfiesPathConstraint(componentPath, constraintPath)) {
      throw new Error(`Cannot find params at path ${constraintPath}!`);
    }

    return this.#navigationStateStore.useStore(() => {
      const params = this.#getAccumulatedParamsAtAbsoluteNavStatePath(componentAbsPath);

      return selector ? selector(params) : params;
    });
  };

  #getAccumulatedParamsAtAbsoluteNavStatePath(navStatePath: AbsNavStatePath) {
    const rootState = this.#navigationStateStore.get();

    const accumulatedParams: Record<string, any> = {};
    navStatePath.forEach((__, i) => {
      if ((i + 1) % 3 === 0) {
        const thisStatePath = navStatePath.slice(0, i + 1);
        const thisRegularPath = absoluteNavStatePathToRegularPath(thisStatePath);
        const val: InnerNavigationState = getStateAtAbsPath(rootState, thisStatePath);

        if ("params" in val && val.params) {
          const theseParamTypes = this.#getDefAtPath(thisRegularPath).params;

          if (!theseParamTypes) {
            throw new Error("No param types found for route! " + thisRegularPath);
          }

          const pr = validateAndCleanInputParams(val.params || {}, theseParamTypes);

          if (!pr.isValid) {
            throw new Error(pr.errors.join("\n"));
          }

          Object.assign(accumulatedParams, pr.params);
        }
      }
    });

    return accumulatedParams;
  }

  public getFocusedParams = (pathConstraint: PathObjResult<any, any, any, any, any, any, any, any>) => {
    const absPath = this.#getFocusedAbsoluteNavStatePath();

    const focusedPath = absoluteNavStatePathToRegularPath(absPath);

    this.#assertPathConstraintIsSatisfied(pathConstraint, focusedPath);
    return this.#getAccumulatedParamsAtAbsoluteNavStatePath(absPath);
  };

  public useIsFocused = (absPath?: AbsNavStatePath) => {
    const thisAbsPath = this.#useAbsoluteNavStatePath();
    return this.#navigationStateStore.useStore(() => {
      return pathSatisfiesPathConstraint(absPath ?? thisAbsPath, this.#getFocusedAbsoluteNavStatePath());
    });
  };

  public useFocusEffect = (fn: () => any) => {
    const thisAbsPath = this.#useAbsoluteNavStatePath();

    const cleanupFn = useRef<null | (() => any)>(null);

    const doFocusEffect = useEvent(() => {
      const yes = pathSatisfiesPathConstraint(thisAbsPath, this.#getFocusedAbsoluteNavStatePath());
      if (yes) {
        cleanupFn.current = fn();
      } else {
        cleanupFn.current?.();
      }
    });

    useEffect(() => {
      doFocusEffect();
      return this.#navigationStateStore.subscribe(doFocusEffect);
    }, []);
  };

  public getFocusedUrl = () => {
    const absPath = this.#getFocusedAbsoluteNavStatePath();
    const path = absoluteNavStatePathToRegularPath(absPath);
    const params = this.#getAccumulatedParamsAtAbsoluteNavStatePath(absPath);

    return this.#generateUrlFromPathArr(path, params);
  };

  public subscribeToFocusedUrl = (fn: (url: string) => void) => {
    let currFocusedUrl: string;
    fn(this.getFocusedUrl());
    return this.#navigationStateStore.subscribe(() => {
      const newFocusedUrl = this.getFocusedUrl();
      if (newFocusedUrl !== currFocusedUrl) {
        currFocusedUrl = newFocusedUrl;
        fn(currFocusedUrl);
      }
    });
  };

  public useFocusedUrl = (selector?: (url: string) => any) => {
    return this.#navigationStateStore.useStore(() => {
      const focusedUrl = this.getFocusedUrl();
      return selector ? selector(focusedUrl) : focusedUrl;
    });
  };

  public goBack = () => {
    Keyboard.dismiss();
    return this.#navigationStateStore.modifyImmutably((rootState) => {
      const focusedAbsPath = this.#getFocusedAbsoluteNavStatePath();

      const pathToGoBackIndex = _.findLastIndex(focusedAbsPath, (a) => typeof a === "number" && a !== 0);

      if (pathToGoBackIndex >= 0) {
        const statePath = focusedAbsPath.slice(0, pathToGoBackIndex - 1);
        const navigatorState:
          | StackNavigationState<any, any, any>
          | SwitchNavigationState<any, any, any>
          | RootNavigationState<any> = getStateAtAbsPath(rootState, statePath);

        if (navigatorState.type === "stack" || navigatorState.type === "root-stack") {
          navigatorState.stack.pop();
        } else {
          navigatorState.focusedSwitchIndex = 0;
        }
      }
    });
  };

  #navigateToPath = (path: string[], params: Record<string, any>, opts?: NavigateOptions) => {
    const { resetTouchedStackNavigators = true } = opts || {};

    if (this.#getDefAtPath(path).type !== "leaf") {
      throw new Error(
        `Unable to navigate to non leaf path ${path.join("/")}! Make sure you completely specify the path.`,
      );
    }

    this.#navigationStateStore.modifyImmutably((rootState) => {
      let currParentState = rootState as RootNavigationState<any> | InnerNavigationState;
      for (let i = 0; i < path.length; i++) {
        const thisDef = this.#getDefAtPath(path.slice(0, i + 1));
        const thisPath = path[i]!;
        const theseParams = thisDef.params ? _.pick(params, Object.keys(thisDef.params)) : undefined;

        if ("stack" in currParentState) {
          if (resetTouchedStackNavigators) {
            currParentState.stack = currParentState.stack.slice(0, 1);
            if (currParentState.stack[0]!.path !== thisPath) {
              currParentState.stack.push(this.#generateInitialInnerState(thisDef, thisPath, params));
            }
          } else {
            const existingPerfectMatchIndex = currParentState.stack.findIndex(
              (a) => a.path === thisPath && _.isEqual(a.params, theseParams),
            );

            if (existingPerfectMatchIndex !== -1) {
              currParentState.stack = currParentState.stack.slice(0, existingPerfectMatchIndex + 1);
            } else {
              currParentState.stack.push(this.#generateInitialInnerState(thisDef, thisPath, params));
            }
          }

          currParentState = currParentState.stack[currParentState.stack.length - 1] as any;
        } else if ("switches" in currParentState) {
          const existingSwitchIndex = currParentState.switches.findIndex((a) => a.path === thisPath);
          if (existingSwitchIndex === -1) {
            currParentState.switches.push(this.#generateInitialInnerState(thisDef, thisPath, params));
          } else {
            currParentState.switches[existingSwitchIndex]!.params = theseParams;
          }

          currParentState.focusedSwitchIndex = currParentState.switches.findIndex((a) => a.path === thisPath);
          currParentState = currParentState.switches[currParentState.focusedSwitchIndex] as any;
        } else if (currParentState.type === "leaf") {
          throw new Error("Invalid leaf route!");
        } else {
          ((a: never) => {})(currParentState);
          throw new Error("Unreachable");
        }
      }
    });
  };

  public navigate = (
    pathObj: PathObjResult<any, any, any, any, any, any, any, any>,
    params: Record<string, any>,
    opts?: NavigateOptions,
  ) => {
    const path = this.#getPathArrFromPathObjResult(pathObj);

    return this.#navigateToPath(path, params, opts);
  };

  public navigateToUrl = (url: string) => {
    const v = this.validateUrl(url);
    if (!v.isValid) {
      throw new Error(v.errors.join("\n"));
    }

    const { path, params } = parseUrl(url);

    return this.#navigateToPath(path, params);
  };

  public reset = () => {
    //TODO...
  };
}

export function lazy<T extends MultiTypeComponent>(a: () => Promise<{ default: T }>): T {
  let Component: any;
  let prom: any;

  function Inner() {
    if (!Component && !prom) {
      prom = a().then((b) => {
        Component = b.default;
        const compName = Component.name || Component.displayName;
        //@ts-ignore
        fn.displayName = compName ? "Lazy" + compName : "LazyComponent";
      });

      throw prom;
    }

    return <Component />;
  }

  const fn = function () {
    return (
      <Suspense fallback={null}>
        <Inner />
      </Suspense>
    );
  } as any as T;

  return fn;
}

/**
 * Iterates through the route definition with the given path, calling `process` for each route definition from root to leaf
 */
function forEachRouteDefUsingPathArray(
  rootDef: RouteDef,
  pathArr: string[],
  processFn: (val: RouteDef | null, routeName: string) => void,
) {
  processFn(rootDef, "");

  let currDef: RouteDef | null = rootDef;
  const arr = [...pathArr];
  while (arr.length) {
    const route = arr.shift()!;
    if (currDef && route && "routes" in currDef && currDef.routes?.[route as any]) {
      currDef = currDef.routes[route as any] as any;
    } else {
      currDef = null;
    }
    processFn(currDef, route);
    if (!currDef) {
      break;
    }
  }
}

function assertIsComponent<T>(val: T, errMsg: string) {
  if (process.env["NODE_ENV"] === "development") {
    //Doesn't need to be too rigorous of checks. Just here to help people debug dumb mistakes.
    const isFunction = typeof val === "function";
    const isLikelyLazyComponent = val && typeof val === "object" && val["$$typeof"];
    const isLikelyLazyBareImport = val && val instanceof Promise;
    if (!val || (!isFunction && !isLikelyLazyComponent && !isLikelyLazyBareImport)) {
      throw new Error(errMsg);
    }
  }

  return val;
}

function absoluteNavStatePathToRegularPath(absNavStatePath: (string | number)[]) {
  //Absolute nav state paths are always in pairs of 3. E.g. "switches" -> 0 -> "someRouteName"
  return _.filter(absNavStatePath, (a, i) => (i + 1) % 3 === 0) as string[];
}

function parseUrl(url: string) {
  const prefix = url.match(/^[^.]+?:\/\//) ? "http://example.com/" : "";
  const { query, pathname } = urlParse(prefix + url);

  return { path: pathname.split("/"), params: queryString.parse(query) };
}

function getStateAtAbsPath(state: RootNavigationState<any>, path: (string | number)[]) {
  if (!path.length) {
    return state;
  } else {
    return _.get(
      state,
      path.filter((a, i) => (i + 1) % 3 !== 0),
    );
  }
}

function pathSatisfiesPathConstraint(path: (string | number)[], pathConstraint: (string | number)[]) {
  return _.isEqual(path, pathConstraint.slice(0, path.length));
}
