import { ParamsOutputObj, $paramsType, GetInputParamsFromPath, ParamsInputObj } from "../implementations/params.js";
import { PathObj, $pathType, PathObjResultLeaf, GenerateUrlFn, UrlString, PathObjResult } from "./path.js";
import { RouteDef } from "./routes.js";
import { ExtractObjectPath } from "../utils/typescript-utils.js";
import { NavigateOptions, RootNavigationState } from "./navigationState.js";

export type RouterOptions = {
  rememberDevState?: boolean; //Defaults to true
  initialNavigationState?: RootNavigationState<any>;
};

export interface Router<T extends RouteDef> {
  /**
   * An object containing all the page paths in the app. Used as an input in many methods
   */
  PATHS: PathObj<T>;

  /**
   * Generate a url from path and params.
   */
  generateUrl: GenerateUrlFn<T>;

  /**
   * Function that returns params satisfying the `pathConstraint` found at the nearest parent navigator.
   * Throws an error if the component has no parent navigator satisfying the `pathConstraint`.
   * Optionally also supply a selector function as the second parameter to reduce re-renders
   *
   * @example
   * // ✅ Satisfies constraint
   * function BazPage(){
   *    const { bloopParam, bazParam } = useParams(PATHS.bloop.baz);
   * }
   *
   * @example
   * // ❌ FooPage does not satisfy constraint PATHS.bloop.baz
   * function FooPage(){
   *    const { bazParam } = useParams(PATHS.bloop.baz);
   * }
   *
   * @example
   * // Also note, it's okay to use less specific path selectors if you don't need all the params. This can potentially make a component easier to re-use within a component subtree.
   * function BazPage(){
   *    const { bloopParam } = useParams(PATHS.bloop);
   * }
   *
   * @example
   * //Use a selector to reduce re-renders
   * function BazPage(){
   *    const yesNo = useParams(PATHS.bloop.baz, a => a.bazParam > 5 ? 'yes' : 'no');
   * }
   */
  useParams<Path extends PathObjResult<any, any, any, any, any, any, any, any>>(
    pathConstraint: Path,
  ): ExtractObjectPath<ParamsOutputObj<T>, Path[$pathType]>[$paramsType];
  useParams<Path extends PathObjResult<any, any, any, any, any, any, any, any>, Ret>(
    pathConstraint: Path,
    selector: (params: ExtractObjectPath<ParamsOutputObj<T>, Path[$pathType]>[$paramsType]) => Ret,
  ): Ret;

  /**
   * The non hook equivalent to useParams. See {@link Router#useParams}
   */
  getFocusedParams<Path extends PathObjResult<any, any, any, any, any, any, any, any>>(
    pathConstraint: Path,
  ): ExtractObjectPath<ParamsOutputObj<T>, Path[$pathType]>[$paramsType];

  /**
   * Equivalent to closing the keyboard if open and then pressing the Android back arrow.
   */
  goBack: () => boolean;

  navigate<Path extends PathObjResultLeaf<any, any, any, any, any, any, any, any>>(
    p: Path,
    params: ExtractObjectPath<ParamsInputObj<T>, Path[$pathType]>[$paramsType],
    opts?: NavigateOptions,
  ): void;

  /**
   * Function w/ callback that lets you to REPLACE the entire navigation state tree. Only the screens navigated to inside the callback will be present.
   * The last screen navigated to will become the current visible screen.
   *
   * @example
   * navigate(PATHS.some.screen, {coolParam: 123})
   * // Time passes...
   * reset(() => {
   *    navigate(PATHS.bloop.baz, {someParam: 1});
   *    navigate(PATHS.foo.bar, {anotherParam: 1});
   * })
   * // `PATHS.foo.bar` is the visible screen now.
   * // `PATHS.bloop.baz` exists in the navigation state tree but is not visible.
   * // `PATHS.some.screen` no longer is mounted.
   */
  reset(doNavigationActions: () => void | Promise<void>): void;

  /**
   * Navigate to a string url. To try and enforce consistency, by default only accepts
   * inputs from the {@link Router#generateUrl} function.
   *
   * @example
   * import { UrlString } from 'rn-typed-router';
   * // Typical
   * navigateToUrl(generateUrl(PATHS.baz, { bazParam: 1}))
   * // Cast string to UrlString
   * navigateToUrl("baz?bazParam=1" as UrlString)
   *
   */
  navigateToUrl: (stringUrl: UrlString, options?: NavigateOptions) => void;

  validateUrl: (url: string) => { isValid: true } | { isValid: false; errors: string[] };

  /**
   * The root navigator. Should be rendered at the root your app.
   */
  Navigator: () => JSX.Element | null;

  /**
   * Returns the current focused state of the screen.
   */
  useIsFocused: () => boolean;

  /**
   * An effect that runs whenever the focus state changes. Internally uses the proposed
   * `useEvent` hook so you don't need to worry about the effect function being stale.
   */
  useFocusEffect: (effect: (isFocused: boolean) => void) => void;

  /**
   * Returns the current url of the app.
   */
  getFocusedUrl: () => string | null;

  /**
   * Subscribe to changes to the current url of the app
   */
  subscribeToFocusedUrl: (subFn: (currPath: string) => any) => () => void;
  /**
   * Returns the current url of the app. Requires a selector to prevent unneccessary renders
   */
  useFocusedUrl: <Ret>(selector: (currUrl: string) => Ret) => Ret;
}
