import _ from "lodash";
import { useEffect, useLayoutEffect, useRef } from "react";
import {
  AuthorFacingWhitelabelComponent,
  ComponentsMap,
  ValidateMode,
  OptionsType,
  ReValidateMode,
  StringWhiteLabelComponentProps,
  UseFormOpts,
  WhitelabelComponentProps,
  WhiteLabelComponentWithOptionsWrapper,
  WhiteLabelComponentWrapper,
  CreateUseWhitelabelFormReturnValue,
} from "../types/Form.js";
import { SimpleStore } from "../types/Store.js";
import { EMAIL_REGEX, LINK_REGEX, useId } from "../utils/utils.js";
import { createSimpleStore } from "./Store.js";

export function createWhitelabelComponent<ExtraProps extends object, Value>(
  Comp: AuthorFacingWhitelabelComponent<ExtraProps, Value>,
): WhiteLabelComponentWrapper<Value, ExtraProps> {
  return Comp as any;
}

export function createWhitelabelComponentWithOptions<ExtraProps extends object, ExtraOptionProps extends object = {}>(
  Comp: AuthorFacingWhitelabelComponent<ExtraProps & OptionsType<unknown, ExtraOptionProps>, unknown>,
): WhiteLabelComponentWithOptionsWrapper<ExtraProps, ExtraOptionProps> {
  return Comp as any;
}

export function createUseWhitelabelForm<Components extends ComponentsMap>(
  createOpts: Components,
): <State extends object>(a: { initState: State }) => CreateUseWhitelabelFormReturnValue<Components, State> {
  return function useForm(useOpts: UseFormOpts<Record<string, any>>) {
    const ret = useRef<any>();

    if (!ret.current) {
      ret.current = createUseFormReturnValue(useOpts, createOpts);
    }

    return ret.current;
  } as any;
}

type UIStore = SimpleStore<
  Record<
    string,
    | {
        errors?: string[];
        isDirty?: boolean;
        hasFocused?: boolean;
        hasBlurred?: boolean;
        hasValidated?: boolean;
      }
    | undefined
  >
>;

type CurrentValidatorsByComponentId = Map<string, (a?: { force?: boolean; silent?: boolean }) => boolean>;

function createUseFormReturnValue(
  formOpts: UseFormOpts<Record<string, any>>,
  AuthorComponents: ComponentsMap,
): CreateUseWhitelabelFormReturnValue<any, any> {
  const dataStore = createSimpleStore(formOpts.initState);
  const uiStore: UIStore = createSimpleStore({});

  const currentValidatorsByComponentId: CurrentValidatorsByComponentId = new Map();

  const executeCurrentValidators = (opts: { force?: boolean; silent?: boolean }) => {
    let isValid = true;

    currentValidatorsByComponentId.forEach((maybeValidateThisFormControl) => {
      const thisIsValid = maybeValidateThisFormControl(opts);
      if (isValid) {
        isValid = thisIsValid;
      }
    });

    return isValid;
  };

  const Components: any = {};
  Object.keys(AuthorComponents).forEach((K) => {
    Components[K] = createWhiteLabelComponentForForm({
      AuthorComponent: AuthorComponents[K] as any,
      uiStore,
      dataStore,
      currentValidatorsByComponentId,
      mode: formOpts.mode,
      revalidateMode: formOpts.reValidateMode,
    });
  });

  const { useStoreValue, ...baseDataStore } = dataStore;

  return {
    useStoreValue,
    store: {
      silentlyValidate: () => executeCurrentValidators({ force: true, silent: true }),
      validate: () => executeCurrentValidators({ force: true }),
      reset: (replacementState) => {
        const nextState = replacementState ?? formOpts.initState;
        dataStore.set(nextState);
      },
      ...baseDataStore,
    },
    ...Components,
  };
}

type InternalConsumerComponentProps = WhitelabelComponentProps<Record<string, any>, Record<string, any>, any> &
  StringWhiteLabelComponentProps;

function createWhiteLabelComponentForForm(formProps: {
  currentValidatorsByComponentId: CurrentValidatorsByComponentId;
  uiStore: UIStore;
  dataStore: SimpleStore<Record<string, any>>;
  AuthorComponent: AuthorFacingWhitelabelComponent<Record<string, any>, string>;
  mode?: ValidateMode;
  revalidateMode?: ReValidateMode;
}) {
  const ConsumerComponent: (compProps: InternalConsumerComponentProps) => JSX.Element = (compProps) => {
    const formControlId = useId();
    const errors = formProps.uiStore.useStoreValue((b) => b[formControlId]?.errors) ?? [];
    const fieldPath = detectAccessedPath(compProps.field as any);

    const maybeValidateThisFormControl = (opts?: { force?: boolean; silent?: boolean }) =>
      maybeValidateFormControl(
        {
          ...formProps,
          ...compProps,
          formControlId,
          fieldPath,
          mode: formProps.mode ?? compProps.mode,
          reValidateMode: formProps.revalidateMode ?? compProps.reValidateMode,
        },
        opts,
      );
    /** Lazily set value using defaultValue*/
    let value = formProps.dataStore.useStoreValue((a) => _.get(a, fieldPath));
    // //I'm not 110% sure, but I think it's safe to lazily set the form defaultValue the first time the form control is rendered.
    if (typeof value === "undefined" && typeof compProps.defaultValue !== "undefined") {
      (formProps.dataStore.setPath as any)(fieldPath, compProps.defaultValue, { silent: true }); //Use the secret "silent" flag on setPath so it doesn't trigger a re-render
      value = compProps.defaultValue;
    }

    /*** Propagate validator function to the parent form...***/
    //Hop
    useEffect(() => {
      formProps.currentValidatorsByComponentId.set(formControlId, maybeValidateThisFormControl);
      return () => {
        formProps.currentValidatorsByComponentId.delete(formControlId);
      };
    }, [fieldPath.join("")]);

    if (typeof compProps["onChangeValue"] !== "undefined") {
      throw new Error("Unable to use reserved field `onChangeValue` as a prop for white label components");
    }

    if (typeof compProps["errors"] !== "undefined") {
      throw new Error("Unable to use reserved field `errors` as a prop for white label components");
    }

    if (typeof compProps["value"] !== "undefined") {
      throw new Error("Unable to use reserved field `value` as a prop for white label components");
    }

    const {
      field,
      defaultValue,
      mode,
      reValidateMode,
      validate,
      required,
      isEmail,
      isUrl,
      max,
      maxLength,
      minLength,
      min,
      pattern,
      onFocus,
      onBlur,
      ...extraProps
    } = compProps;

    const AuthorComponent = formProps.AuthorComponent;

    return (
      <AuthorComponent
        {...extraProps}
        errors={errors}
        onBlur={() => {
          formProps.uiStore.mutate((a) => {
            if (!a[formControlId]?.hasBlurred) {
              a[formControlId] = a[formControlId] || {};
              a[formControlId]!.hasBlurred = true;
            }
          });
          maybeValidateThisFormControl();

          if (typeof onBlur === "function") {
            onBlur();
          }
        }}
        onFocus={() => {
          formProps.uiStore.mutate((a) => {
            if (!a[formControlId]?.hasFocused) {
              a[formControlId] = a[formControlId] || {};
              a[formControlId]!.hasFocused = true;
            }
          });

          if (typeof onFocus === "function") {
            onFocus();
          }
        }}
        onChangeValue={(newVal) => {
          formProps.dataStore.setPath(fieldPath, newVal);
          maybeValidateThisFormControl();
        }}
        value={value}
      />
    );
  };

  return ConsumerComponent;
}

function maybeValidateFormControl(
  c: {
    formControlId: string;
    fieldPath: string[];
    uiStore: UIStore;
    dataStore: SimpleStore<Record<string, any>>;
  } & InternalConsumerComponentProps,
  opts?: { force?: boolean; silent?: boolean },
): boolean {
  const thisMode = c.mode ?? "onBlur";
  const thisReValidateMode = c.reValidateMode ?? "onBlur";

  const { hasBlurred, hasFocused, hasValidated, isDirty } = c.uiStore.get()[c.formControlId] || {};

  const selectedMode = hasValidated ? thisReValidateMode : thisMode;

  //TODO: This is likely wrong...
  let shouldValidate = false;
  if (selectedMode === "all" || opts?.force) {
    shouldValidate = true;
  } else if (selectedMode === "onBlur") {
    shouldValidate = !!hasBlurred;
  } else if (selectedMode === "onTouched") {
    shouldValidate = !!hasFocused;
  } else if (selectedMode === "onChange") {
    shouldValidate = !!isDirty;
  }

  if (!shouldValidate) {
    return true;
  }

  const currValue = _.get(c.dataStore.get(), c.fieldPath);

  const errorStrings: string[] = [];

  if (c.validate) {
    const val = c.validate(currValue);
    if (val instanceof Array) {
      errorStrings.push(...val);
    } else if (val) {
      errorStrings.push(val);
    }
  }

  if (c.required) {
    if (!currValue) {
      errorStrings.push(typeof c.required === "string" && c.required ? c.required : "Required");
    }
  }

  if (c.isEmail) {
    if (!EMAIL_REGEX.test(currValue)) {
      errorStrings.push(typeof c.isEmail === "string" && c.isEmail ? c.isEmail : "Must be email");
    }
  }

  if (c.isUrl) {
    if (!LINK_REGEX.test(currValue)) {
      errorStrings.push(typeof c.isUrl === "string" && c.isUrl ? c.isUrl : "Must be valid url");
    }
  }

  if (c.minLength) {
    if (typeof currValue === "string" || currValue instanceof Array) {
      const thisMinLength = typeof c.minLength === "number" ? c.minLength : c.minLength[0];
      if (currValue.length < thisMinLength) {
        if (c.minLength instanceof Array) {
          errorStrings.push(c.minLength[1]);
        } else {
          errorStrings.push(
            currValue instanceof Array
              ? `Must select at least ${thisMinLength} items`
              : `Must have at least ${thisMinLength} characters`,
          );
        }
      }
    }
  }

  if (c.maxLength) {
    if (typeof currValue === "string" || currValue instanceof Array) {
      const thisMaxLength = typeof c.maxLength === "number" ? c.maxLength : c.maxLength[0];
      if (currValue.length > thisMaxLength) {
        if (c.maxLength instanceof Array) {
          errorStrings.push(c.maxLength[1]);
        } else {
          errorStrings.push(
            currValue instanceof Array
              ? `Cannot select more than ${thisMaxLength} items`
              : `Must be less than ${thisMaxLength} characters`,
          );
        }
      }
    }
  }

  if (c.pattern) {
    const thisPattern = c.pattern instanceof Array ? c.pattern[0] : c.pattern;
    if (!thisPattern.test(currValue)) {
      errorStrings.push(c.pattern instanceof Array ? c.pattern[1] : "Invalid pattern");
    }
  }

  if (c.min) {
    const thisMin = c.min instanceof Array ? c.min[0] : c.min;
    if (currValue < thisMin) {
      errorStrings.push(c.min instanceof Array ? c.min[1] : `Must be more than ${thisMin}`);
    }
  }

  if (c.max) {
    const thisMax = c.max instanceof Array ? c.max[0] : c.max;
    if (currValue > thisMax) {
      errorStrings.push(c.max instanceof Array ? c.max[1] : `Must be less than ${thisMax}`);
    }
  }

  if (!opts?.silent) {
    c.uiStore.mutate((b) => {
      if (!b[c.formControlId]?.errors) {
        b[c.formControlId] = b[c.formControlId] || {};
        b[c.formControlId]!.errors = [];
      }
      b[c.formControlId]!.errors = errorStrings;
    });
  }

  return !errorStrings.length;
}

function createWildcardObject(pathRef: (string | Symbol)[]): any {
  return new Proxy(
    {},
    {
      get(t, key) {
        pathRef.push(key);
        return createWildcardObject(pathRef);
      },
      set() {
        return false;
      },
    },
  );
}

//Do some Proxy weirdness to detect which path was accessed
function detectAccessedPath<T extends object>(fn: (obj: T) => string[]): string[] {
  const accessedPath: string[] = [];
  const wildcard = createWildcardObject(accessedPath);

  fn(wildcard);

  return accessedPath;
}
