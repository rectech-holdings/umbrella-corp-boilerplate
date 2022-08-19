import { validateAndCleanInputParams, ParamTypesClass, ParamsTypeRecord } from "./params.js";
import { PathObjResult, PathObjResultLeaf, UrlString } from "../types/path.js";
import { LinkProps, Router, RouterOptions } from "../types/router.js";
import { MultiTypeComponent, RouteDef, StackRouteDef, SwitchRouteDef } from "../types/routes.js";
import { dequal } from "dequal/lite";
import urlParse from "url-parse";
import useEvent from "use-event-callback";
import _ from "lodash";
import React, { createContext, ReactNode, Suspense, useContext, useEffect, useRef, useState } from "react";
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
import {
  BackHandler,
  history,
  Keyboard,
  Platform,
  Screen,
  ScreenContainer,
  ScreenStack,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "./primitives";
import { Freeze } from "../utils/react-freeze.js";
import type { TextProps, TouchableOpacityProps } from "react-native";

export function createRouter<T extends RouteDef>(rootDefinition: T, opts?: RouterOptions): Router<T> {
  const thisRouter: Router<any> = new RouterClass(rootDefinition, opts);

  return thisRouter as any as Router<T>;
}

class RouterClass implements Router<any> {
  #rootDef: RouteDef;

  #getDefAtPath = _.memoize(
    (pathArr: string[]) => {
      let retDef: RouteDef;
      forEachRouteDefUsingPathArray(this.#rootDef, pathArr, (a) => {
        if (!a.thisDef) {
          throw new NotFoundError({
            msg: `Unable to find route definitition for the path ${pathArr.join("/")}`,
            path: pathArr,
          });
        } else {
          retDef = a.thisDef;
        }
      });
      return retDef!;
    },
    (a) => a.join(""),
  );

  //Returns an object with all the ParamTypes found at the path and the path's parents
  #getAccumulatedParamTypesAtPath = _.memoize(
    (pathArr: string[], throwOnNotFound: boolean): Record<string, any> => {
      const paramTypes: Record<string, ParamTypesClass<any, any, any>> = {};
      forEachRouteDefUsingPathArray(this.#rootDef, pathArr, (a) => {
        if (!a.thisDef) {
          if (throwOnNotFound) {
            throw new NotFoundError({
              msg: `Unable to find route definitition for the path ${pathArr.join("/")}`,
              path: pathArr,
            });
          }
        } else {
          Object.assign(paramTypes, a.thisDef.params || {});
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

  #history = Platform.OS === "web" ? history.createBrowserHistory() : null;

  #unsubscribes: (() => void)[] | null = null;
  //This fn gets called during the root Navigator render
  #maybeSetupSubscriptions() {
    if (this.#unsubscribes !== null) {
      return;
    }
    this.#unsubscribes = [];

    if (Platform.OS === "android") {
      const fn = () => this.goBack();
      BackHandler.addEventListener("hardwareBackPress", fn);
      this.#unsubscribes.push(() => {
        BackHandler.removeEventListener("hardwareBackPress", fn);
      });
    }

    if (Platform.OS === "web" && this.#history) {
      this.#unsubscribes.push(
        this.#history.listen((e) => {
          const url = e.location.pathname + e.location.search;
          if (e.action === history.Action.Pop) {
            const { path, params } = parseUrl(url);
            this.#navigateToPath(path, params, { browserHistoryAction: "none" });
          }
        }),
      );
    }
  }

  //This gets called when the root navigator is unmounted
  #tearDownSubscriptions() {
    this.#unsubscribes?.forEach((fn) => fn());
    this.#unsubscribes = null;
  }

  constructor(rootDef: RouteDef, opts?: RouterOptions) {
    this.#rootDef = rootDef;
    if (opts?.initialNavigationState) {
      //TODO: Validate opts?.initialNavigationState and clear it with warning if invalid
    }

    const initState = opts?.initialNavigationState || this.#generateInitialRootState(rootDef);

    this.#navigationStateStore = createZustandStore(initState);

    if (Platform.OS === "web") {
      const currUrl = this.getFocusedUrl();
      const browserUrl = (window.location.pathname + window.location.search).replace(/^\//, "");
      if (currUrl !== browserUrl) {
        const { path, params } = parseUrl(browserUrl ? browserUrl : currUrl);
        this.#navigateToPath(path, params, { browserHistoryAction: "replace" });
      }
    }
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
      return omitUndefined({
        type: "leaf",
        path,
        params,
      });
    } else if ("routes" in def) {
      const initialRoute = def.initialRoute || Object.keys(def.routes)[0]!;
      const initialInnerState = this.#generateInitialInnerState(
        def.routes[initialRoute]!,
        initialRoute,
        allAccumulatedParams,
      );

      if (def.type == "stack") {
        return omitUndefined({
          type: "stack",
          path,
          params,
          stack: [initialInnerState],
        });
      } else if (def.type === "switch") {
        return omitUndefined({
          type: "switch",
          path,
          params,
          focusedSwitchIndex: 0,
          switches: [initialInnerState],
        });
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
  ): {
    (): JSX.Element;
    Header?: () => JSX.Element;
    loadComponent?: () => Promise<void>;
    hasLoaded?: () => boolean;
  } | null;
  #getComponentAtPath(path: string[], type: "wrappingComponents"): ((a: { children: ReactNode }) => JSX.Element) | null;
  #getComponentAtPath(path: string[], type: "leaf" | "footer" | "header" | "wrappingComponents"): any {
    return this.#getComponentAtPathMemoized(path, type);
  }

  #getComponentAtPathMemoized = _.memoize(
    (path: string[], type: "leaf" | "footer" | "header" | "wrappingComponents"): any => {
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
      } else if (type === "wrappingComponents") {
        const Wrapper = childDef.Wrapper
          ? assertIsComponent(
              childDef.Wrapper,
              "Wrapper was defined on a route but is not a react component! " + path.join("/"),
            )
          : React.Fragment;

        const ErrorHandler = childDef.ErrorHandler
          ? assertIsComponent(
              childDef.ErrorHandler,
              "ErrorHandler was defined on a route but is not a react component! " + path.join("/"),
            )
          : null;

        if (ErrorHandler) {
          Component = class InnerErrorHandler extends React.Component<{ children: ReactNode }> {
            state: { error?: unknown } = {};
            componentDidCatch(error: unknown) {
              this.setState({ error });
            }

            render() {
              if (this.state.error && ErrorHandler) {
                return <ErrorHandler error={this.state.error} />;
              }

              return <Wrapper>{this.props.children}</Wrapper>;
            }
          };
        } else {
          Component = Wrapper;
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
    },
    (a, b) => a.join("") + b,
  );

  #getFocusedAbsoluteNavStatePath(rootState: RootNavigationState<any> = this.#navigationStateStore.get()) {
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

  public InlineLink = (
    a: {
      children: ReactNode;
      path: PathObjResultLeaf<any, any, any, any, any, any, any, any>;
      params: Record<string, any>;
    } & TextProps &
      LinkProps,
  ) => {
    const { children, path, params, hrefLang, media, rel, target, referrerPolicy, ...rest } = a;

    const platformProps =
      Platform.OS === "web"
        ? { href: "/" + this.generateUrl(path, params), hrefLang, media, rel, target, referrerPolicy }
        : {
            onPress: () => {
              this.navigate(path, params);
            },
          };

    return (
      <Text accessibilityRole="link" {...platformProps} {...rest}>
        {children}
      </Text>
    );
  };

  public BlockLink = (
    a: {
      children: ReactNode;
      path: any;
      params: any;
    } & Omit<TouchableOpacityProps, "onPress"> & { onPress?: () => void } & LinkProps,
  ) => {
    const { children, path, params, hrefLang, media, referrerPolicy, rel, target, ...rest } = a;

    const { onPress, accessibilityRole, activeOpacity, ...restTouchableProps } = rest;

    const webLink: any =
      Platform.OS === "web" ? (
        <a
          //Expand the link to fill it's container. See: https://css-tricks.com/a-complete-guide-to-links-and-buttons/#aa-links-around-bigger-chunks-of-content
          style={{ position: "absolute", top: 0, right: 0, left: 0, bottom: 0 }}
          onClick={(e) => {
            onPress?.();

            if (
              //Use same logic as react-router here...
              !e.defaultPrevented &&
              e.button === 0 && //Ignore non-left clicks
              (!target || target === "_self") && //Ignore if target is set
              !(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) //Ignore if click modifiers
            ) {
              e.preventDefault();
              this.navigate(path, params);
            }
          }}
          href={"/" + this.generateUrl(path, params)}
          hrefLang={hrefLang}
          media={media}
          referrerPolicy={referrerPolicy}
          rel={rel}
          target={target}
        />
      ) : null;

    return (
      <TouchableOpacity
        activeOpacity={activeOpacity ?? 1}
        accessibilityRole={accessibilityRole ?? "link"}
        onPress={
          Platform.OS === "web"
            ? undefined
            : () => {
                onPress?.();
                this.navigate(path, params);
              }
        }
        {...restTouchableProps}
      >
        {webLink}
        {children}
      </TouchableOpacity>
    );
  };

  //NOTE: This is the root navigator
  public Navigator = () => {
    const navState = this.#navigationStateStore.useStore();
    const InnerNavigator = this.#InnerNavigator;
    this.#maybeSetupSubscriptions();
    useEffect(() => {
      return () => {
        this.#tearDownSubscriptions();
      };
    }, []);

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

    if (!hasEverBeenFocused) {
      return null;
    }

    if (p.state.shouldRenderNotFoundError) {
      const { NotFoundHandler } = this.#getDefAtPath(p.path);
      if (!NotFoundHandler) {
        throw new Error(
          "Error in router internals. Should not set state property `shouldRenderNotFoundError` unless a NotFoundHandler is also defined",
        );
      }

      return <NotFoundHandler />;
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

    return <Provider value={p.absoluteNavStatePath}>{inner}</Provider>;
  };

  #InnerLeafNavigator = React.memo((p: { path: string[] }) => {
    const Leaf = this.#getComponentAtPath(p.path, "leaf");
    const LeafHeader = Leaf?.Header ?? this.#getComponentAtPath(p.path, "header");

    if (process.env["NODE_ENV"] === "development") {
      if (LeafHeader && typeof LeafHeader !== "function") {
        throw new Error(`Header at ${p.path.join("/")} does not return a valid react component!`);
      }
    }
    const Wrapper = this.#getComponentAtPath(p.path, "wrappingComponents") || React.Fragment;

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
  }, dequal);

  #InnerStackNavigator = React.memo(
    (p: { path: string[]; state: StackNavigationState<any, any, any>; absoluteNavStatePath: (string | number)[] }) => {
      const Wrapper = this.#getComponentAtPath(p.path, "wrappingComponents") || React.Fragment;

      const parentDef = this.#getDefAtPath(p.path)! as StackRouteDef;

      const InnerNavigator = this.#InnerNavigator;

      return (
        <Wrapper>
          <ScreenStack style={{ flex: 1 }}>
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
                  hideKeyboardOnSwipe={true}
                  gestureEnabled={true}
                  onDismissed={(e) => {
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
                  <Freeze freeze={i < p.state.stack.length - 2}>
                    {Header ? <Header /> : null}
                    <View style={{ flex: 1 }}>
                      <InnerNavigator
                        state={thisNavigationState as any}
                        path={thisRoutePath}
                        absoluteNavStatePath={p.absoluteNavStatePath.concat("stack", i, thisNavigationState.path)}
                      />
                    </View>
                  </Freeze>
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
      const Wrapper = this.#getComponentAtPath(p.path, "wrappingComponents") || React.Fragment;
      const Header = this.#getComponentAtPath(p.path, "header");
      const Footer = this.#getComponentAtPath(p.path, "footer");

      //Gotta do some weird shenanigans to make the transition smooth and not show a switch page too soon (before it has had time to render at least once)
      //Hopefully will be fixed by React Native Screens when this issue gets resolved: https://github.com/software-mansion/react-native-screens/issues/1251
      //TODO: The web could also use this optimization. There's a bit of a flash. Could probably just be a timeout though
      const focusedSwitchIndex = p.state.focusedSwitchIndex;
      const prevRawFocusedSwitchIndex = usePreviousValue(focusedSwitchIndex);
      const [indexHasMounted, setIndexHasMounted] = useState<Record<number, true>>({});
      const isMountedRef = useIsMountedRef();
      const parentDef = this.#getDefAtPath(p.path)! as SwitchRouteDef;

      const InnerNavigator = this.#InnerNavigator;

      return (
        <Wrapper>
          <View style={{ flex: 1 }}>
            {Header ? <Header /> : null}
            <ScreenContainer style={{ flex: 1 }}>
              {p.state.switches.map((thisNavigationState, i) => {
                //Here come the weird shenanigans...
                let activityState: 0 | 1 | 2;
                let zIndex: number;

                if (Platform.OS === "ios") {
                  if (i === focusedSwitchIndex) {
                    const shouldDisplay = indexHasMounted[focusedSwitchIndex] || prevRawFocusedSwitchIndex === null;
                    activityState = shouldDisplay ? 2 : 1;
                    zIndex = shouldDisplay ? 1 : -1;
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

                if (parentDef.keepChildrenMounted !== true && activityState === 0) {
                  return null;
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
                    <Freeze freeze={activityState === 0}>
                      <InnerNavigator
                        state={thisNavigationState as any}
                        path={thisRoutePath}
                        absoluteNavStatePath={p.absoluteNavStatePath.concat("switches", i, thisNavigationState.path)}
                      />
                    </Freeze>
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
      throw new NotFoundError({
        msg: pr.errors.join("\n"),
        path: pathArr,
        params: inputParams,
      });
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

    forEachRouteDefUsingPathArray(this.#rootDef, path, (a) => {
      if (!a.thisDef) {
        errors.push(`Unable to find route for the url path ${path.join("/")}`);
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

  public useParams = (
    pathConstraint: PathObjResult<any, any, any, any, any, any, any, any>,
    selector?: (a: Record<string, any>) => any,
  ) => {
    const constraintPath = this.#getPathArrFromPathObjResult(pathConstraint);
    const componentAbsPath = this.#useAbsoluteNavStatePath();
    const componentPath = absoluteNavStatePathToRegularPath(componentAbsPath);

    if (!pathSatisfiesPathConstraint(componentPath, constraintPath)) {
      throw new NotFoundError({
        msg: `Cannot find params at path ${constraintPath}! Current path is ${componentPath}`,
        path: componentPath,
      });
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
            throw new NotFoundError({
              msg: "No param types found for route! " + thisRegularPath,
              path: absoluteNavStatePathToRegularPath(navStatePath),
              params: { ...accumulatedParams, ...val.params },
            });
          }

          const pr = validateAndCleanInputParams(val.params || {}, theseParamTypes);

          if (!pr.isValid) {
            throw new NotFoundError({
              msg: pr.errors.join("\n"),
              path: absoluteNavStatePathToRegularPath(navStatePath),
              params: { ...accumulatedParams, ...val.params },
            });
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
    const constraintPathStr = this.#getPathArrFromPathObjResult(pathConstraint).join("/");

    const pathStr = focusedPath.join("/");
    if (pathStr !== constraintPathStr) {
      throw new Error(
        `Invalid path accessed! The currentpath ${pathStr} does not satisfy the required path ${constraintPathStr}`,
      );
    }

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
    const { hasChanges } = this.#navigationStateStore.modifyImmutably((rootState) => {
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

    if (hasChanges && this.#history && Platform.OS === "web") {
      this.#history.back();
    }

    return hasChanges;
  };

  #modifyStateForNavigateToPath(
    path: string[],
    params: Record<string, any>,
    opts: { resetTouchedStackNavigators: boolean; isModifyingForNotFoundError: boolean },
  ) {
    return this.#navigationStateStore.modifyImmutably(
      (rootState) => {
        let currParentState = rootState as RootNavigationState<any> | InnerNavigationState;
        for (let i = 0; i < path.length; i++) {
          const thisDef = this.#getDefAtPath(path.slice(0, i + 1));
          const thisPath = path[i]!;
          const theseParams = thisDef.params ? _.pick(params, Object.keys(thisDef.params)) : undefined;

          if ("stack" in currParentState) {
            if (opts.resetTouchedStackNavigators) {
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
        if (opts.isModifyingForNotFoundError) {
          //Set shouldRenderNotFoundError on the terminal state if there was a not found error
          currParentState.shouldRenderNotFoundError = true;
        } else {
          //After a successful navigate like this, ensure there's no lingering `shouldRenderNotFoundError` properties anywhere in the state
          traverse(rootState, (obj) => {
            if (obj && typeof obj === "object" && "shouldRenderNotFoundError" in obj) {
              delete obj["shouldRenderNotFoundError"];
            }
          });
        }
      },
      { dryRun: true },
    );
  }

  #navigateToPath = (path: string[], params: Record<string, any>, opts?: NavigateToPathOpts) => {
    const { resetTouchedStackNavigators = true, browserHistoryAction = "push" } = opts || {};

    let ret: { hasChanges: boolean; nextState: RootNavigationState<any> }, error: any;
    try {
      if (this.#getDefAtPath(path).type !== "leaf") {
        throw new NotFoundError({
          msg: `Unable to navigate to non leaf path ${path.join("/")}! Make sure you completely specify the path.`,
          path,
          params,
        });
      }

      ret = this.#modifyStateForNavigateToPath(path, params, {
        resetTouchedStackNavigators,
        isModifyingForNotFoundError: false,
      });
    } catch (e) {
      error = e;
    }

    if (error) {
      if (error instanceof NotFoundError) {
        const info: ForEachRouteDefCallbackVal[] = [];
        forEachRouteDefUsingPathArray(this.#rootDef, error.path, (a) => (a.thisDef ? info.push(a) : null));

        const notFoundHandlerInfo = info.reverse().find((a) => a.thisDef.NotFoundHandler);

        if (!notFoundHandlerInfo) {
          throw error;
        } else {
          ret = this.#modifyStateForNavigateToPath(
            notFoundHandlerInfo.thisPath,
            {},
            { resetTouchedStackNavigators, isModifyingForNotFoundError: true },
          );
        }
      } else {
        throw error;
      }
    }

    const { hasChanges, nextState } = ret!;

    if (!hasChanges) {
      return;
    }

    const nextPath = absoluteNavStatePathToRegularPath(this.#getFocusedAbsoluteNavStatePath(nextState));
    const Leaf = this.#getComponentAtPath(nextPath, "leaf");

    if (!error && Platform.OS === "web" && this.#history && browserHistoryAction !== "none") {
      const url = "/" + this.#generateUrlFromPathArr(path, params);
      if (browserHistoryAction === "push") {
        this.#history.push(url);
      } else if (browserHistoryAction === "replace") {
        this.#history.replace(url);
      } else {
        ((a: never) => {})(browserHistoryAction);
        throw new Error("Unreachable");
      }
    }

    //Some optimization on lazy components to defer state change until AFTER the lazy component has loaded. Reduces jank a bit.
    if (Leaf && Leaf.loadComponent && !Leaf.hasLoaded?.()) {
      Promise.race([Leaf.loadComponent(), new Promise((res) => setTimeout(res, 150))]).then(() => {
        this.#navigationStateStore.set(nextState);
      }, console.error);
    } else {
      this.#navigationStateStore.set(nextState);
    }
  };

  public navigate = (
    pathObj: PathObjResult<any, any, any, any, any, any, any, any>,
    params: Record<string, any>,
    opts?: NavigateOptions,
  ) => {
    const path = this.#getPathArrFromPathObjResult(pathObj);

    return this.#navigateToPath(path, params, opts);
  };

  public navigateToUrl(url: string, opts?: NavigateOptions) {
    const v = this.validateUrl(url);
    if (!v.isValid) {
      throw new Error(v.errors.join("\n"));
    }

    const { path, params } = parseUrl(url);

    return this.#navigateToPath(path, params, opts);
  }

  public reset = () => {
    //TODO...
  };
}

type LazyComponent<T extends MultiTypeComponent> = T & {
  loadComponent?: () => Promise<void>;
  isLoaded: () => boolean;
};

/**
 * A custom `lazy` function used as an alternative to `React.lazy`. Let's us do some optimizations on routing to prevent
 * some dropped frames and get around some Suspense errors we were seeing.
 */
export function lazy<T extends MultiTypeComponent>(component: () => Promise<{ default: T }>): LazyComponent<T> {
  let Component: any;
  let prom: any;

  const loadComponent = () => {
    if (!prom) {
      prom = component().then((b) => {
        Component = b.default;
        const compName = Component.name || Component.displayName;
        //@ts-ignore
        fn.displayName = compName ? "Lazy" + compName : "LazyComponent";
      });
    }

    return prom;
  };

  function Inner() {
    if (!Component) {
      loadComponent();
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

  (fn as any).loadComponent = loadComponent;
  (fn as any).hasLoaded = () => {
    return !!Component;
  };

  return fn as any;
}

type ForEachRouteDefCallbackVal = { thisDef: RouteDef; thisRouteName: string; thisPath: string[] };

/**
 * Iterates through the route definition with the given path, calling `process` for each route definition from root to leaf
 */
function forEachRouteDefUsingPathArray(
  rootDef: RouteDef,
  pathArr: string[],
  processFn: (a: ForEachRouteDefCallbackVal | { thisDef: null; thisPath: string[] }) => void,
) {
  processFn({ thisDef: rootDef, thisRouteName: "", thisPath: [] });

  let currDef: RouteDef | null = rootDef;
  for (let i = 0; i < pathArr.length; i++) {
    const route = pathArr[i];
    const thisPath = pathArr.slice(0, i + 1);
    if (currDef && route && "routes" in currDef && currDef.routes?.[route as any]) {
      currDef = currDef.routes[route as any] as any;
      processFn({ thisDef: currDef!, thisRouteName: route, thisPath });
    } else {
      processFn({ thisDef: null, thisPath });
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
  if (url.startsWith("/")) {
    url = url.slice(1);
  }

  const prefix = url.match(/^[^.]+?:\/\//) ? "" : "http://example.com/";

  let { query, pathname } = urlParse(prefix + url);

  if (pathname.startsWith("/")) {
    pathname = pathname.slice(1);
  }

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

class NotFoundError extends Error {
  path: string[];
  params?: ParamsTypeRecord;

  constructor(a: { msg: string; path: string[]; params?: ParamsTypeRecord }) {
    super(a.msg);
    this.path = a.path;
    this.params = a.params;
  }
}

function omitUndefined<T extends Record<string, any>>(obj: T): T {
  return _.omitBy(obj, _.isUndefined) as any;
}

function traverse(jsonObj: any, fn: (val: any) => any) {
  fn(jsonObj);

  if (jsonObj !== null && typeof jsonObj == "object") {
    Object.entries(jsonObj).forEach(([key, value]) => {
      traverse(value, fn);
    });
  }
}

type NavigateToPathOpts = NavigateOptions & { browserHistoryAction?: "push" | "none" | "replace" };
