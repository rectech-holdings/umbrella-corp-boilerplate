import { SimpleStore } from "../types/Store.js";
import { produce } from "immer";
import _ from "lodash";
import { useSyncExternalStore } from "use-sync-external-store";
import { useLayoutEffect, useState } from "react";
import { EMAIL_REGEX, LINK_REGEX } from "../utils/utils.js";

export function createSimpleStore<T extends object>(initState: T): SimpleStore<T> {
  const ee = createSimpleEmitter();
  let currState = initState;

  return {
    get() {
      return currState;
    },
    mutate(fn) {
      const nextState = produce(currState, fn as any);

      const doModify = (final: any) => {
        const didChange = currState !== final;

        if (didChange) {
          currState = final;
          ee.emit(currState);
        }

        return didChange;
      };

      if (nextState instanceof Promise) {
        return nextState.then((v) => doModify(v)) as any;
      } else {
        return doModify(nextState) as any;
      }
    },
    set(newState) {
      currState = newState;
      ee.emit(currState);
    },
    setPath(path, newVal, secret?: { silent?: true }) {
      currState = produce(currState, (draft: any) => {
        _.set(draft, path, newVal);
      });

      //We need a secret silent flag for lazily setting the store to the form default value the first time the value is rendered
      if (!secret?.silent) {
        ee.emit(currState);
      }
    },
    subscribe(fn) {
      return ee.onChange(fn);
    },
    updateDeep(changes) {
      currState = produce(currState, (draft: any) => {
        _.merge(draft, changes);
      });
      ee.emit(currState);
    },
    updateShallow(changes) {
      currState = produce(currState, (draft: any) => {
        Object.assign(draft, changes);
      });
      ee.emit(currState);
    },
    useStoreValue(selector) {
      return useSyncExternalStore(ee.onChange, () => (selector ? selector(currState) : currState)) as any;
    },
  };
}

export function createFormStore<ExtraProps extends object>(c: UseFormOpts<any>) {
  return {
    useRegisterForm(
      props:
        | ({ formControlType: "input" } & InputProps<ExtraProps, {}>)
        | ({ formControlType: "select" } & SelectProps<ExtraProps, {}, unknown>),
    ) {
      const { opts, ...nativeProps } = props;
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
      } = opts;

      const { onChange, onBlur, onFocus, ...restNativeProps } = nativeProps;
      const formControlId = useId();
      const errors = uiStore.useStoreValue((a) => a[formControlId]?.errors) ?? [];

      const fieldPath = detectAccessedPath(field as any);

      let value = dataStore.useStoreValue((a) => _.get(a, fieldPath));

      // //I'm not 110% sure, but I think it's safe to lazily set the form defaultValue the first time the form control is rendered.
      if (typeof value === "undefined" && typeof defaultValue !== "undefined") {
        (dataStore.setPath as any)(fieldPath, defaultValue, { silent: true }); //Use the secret "silent" flag on setPath so it doesn't trigger a re-render
        value = defaultValue;
      }

      //TODO: Refactor this to require a lot more props to be passed and to have a stable identity
      function maybeValidateThisFormControl(a?: { force?: boolean; silent?: boolean }): boolean {
        const thisMode = mode ?? c.mode ?? "onBlur";
        const thisReValidateMode = reValidateMode ?? c.reValidateMode ?? "onBlur";

        const { hasBlurred, hasFocused, hasValidated, isDirty } = uiStore.get()[formControlId] || {};

        const selectedMode = hasValidated ? thisReValidateMode : thisMode;

        //TODO: This is likely wrong...
        let shouldValidate = false;
        if (selectedMode === "all" || a?.force) {
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

        const currValue = _.get(dataStore.get(), fieldPath);

        const errorStrings: string[] = [];

        if (validate) {
          const val = validate(currValue);
          if (val instanceof Array) {
            errorStrings.push(...val);
          } else if (val) {
            errorStrings.push(val);
          }
        }

        if (required) {
          if (typeof currValue === "undefined") {
            errorStrings.push(typeof required === "string" && required ? required : "Required");
          }
        }

        if (isEmail) {
          if (!EMAIL_REGEX.test(currValue)) {
            errorStrings.push(typeof isEmail === "string" && isEmail ? isEmail : "Must be email");
          }
        }

        if (isUrl) {
          if (!LINK_REGEX.test(currValue)) {
            errorStrings.push(typeof isUrl === "string" && isUrl ? isUrl : "Must be valid url");
          }
        }

        if (minLength) {
          if (typeof currValue === "string" || currValue instanceof Array) {
            const thisMinLength = typeof minLength === "number" ? minLength : minLength[0];
            if (currValue.length < thisMinLength) {
              if (minLength instanceof Array) {
                errorStrings.push(minLength[1]);
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

        if (maxLength) {
          if (typeof currValue === "string" || currValue instanceof Array) {
            const thisMaxLength = typeof maxLength === "number" ? maxLength : maxLength[0];
            if (currValue.length > thisMaxLength) {
              if (maxLength instanceof Array) {
                errorStrings.push(maxLength[1]);
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

        if (pattern) {
          const thisPattern = pattern instanceof Array ? pattern[0] : pattern;
          if (!thisPattern.test(currValue)) {
            errorStrings.push(pattern instanceof Array ? pattern[1] : "Invalid pattern");
          }
        }

        if (min) {
          const thisMin = min instanceof Array ? min[0] : min;
          if (currValue < thisMin) {
            errorStrings.push(min instanceof Array ? min[1] : `Must be more than ${thisMin}`);
          }
        }

        if (max) {
          const thisMax = max instanceof Array ? max[0] : max;
          if (currValue > thisMax) {
            errorStrings.push(max instanceof Array ? max[1] : `Must be less than ${thisMax}`);
          }
        }

        if (!a?.silent) {
          uiStore.mutate((b) => {
            if (!b[formControlId]?.errors) {
              b[formControlId] = b[formControlId] || {};
              b[formControlId]!.errors = [];
            }
            b[formControlId]!.errors = errorStrings;
          });
        }

        return !errorStrings.length;
      }

      //TODO: Set lazily during render once maybeValidateThisFormControl is refactored to be stable
      useLayoutEffect(() => {
        currentValidators.set(formControlId, maybeValidateThisFormControl);
        return () => {
          currentValidators.delete(formControlId);
        };
      });

      function onChangeInner(newVal: any) {
        dataStore.setPath(fieldPath, newVal);
        uiStore.mutate((a) => {
          if (!a[formControlId]?.isDirty) {
            a[formControlId] = a[formControlId] || {};
            a[formControlId]!.isDirty = true;
          }
        });
        maybeValidateThisFormControl();
        onChange?.(newVal);
      }

      const ret = {
        errors,
        nativeProps: {
          onBlur(e: any) {
            uiStore.mutate((a) => {
              if (!a[formControlId]?.hasBlurred) {
                a[formControlId] = a[formControlId] || {};
                a[formControlId]!.hasBlurred = true;
              }
            });
            maybeValidateThisFormControl();
            onBlur?.(e);
          },

          onFocus(e: any) {
            uiStore.mutate((a) => {
              if (!a[formControlId]?.hasFocused) {
                a[formControlId] = a[formControlId] || {};
                a[formControlId]!.hasFocused = true;
              }
            });
            onFocus?.(e);
          },
          value,
          ...restNativeProps,
        },
      };

      if (props.formControlType === "input") {
        ret.nativeProps["onChange"] = (e: any) => {
          onChangeInner(e.target.value);
          onChange?.(e);
        };

        return ret;
      } else if (props.formControlType === "select") {
        ret.nativeProps["onChange"] = (e: any) => {
          const newVal = props.opts.options.find((a) => a.key === e.target.value);
          if (typeof newVal === "undefined") {
            throw new Error("Invalid option selected somehow!");
          }
          onChangeInner(newVal);
          onChange?.(e);
        };
        return ret;
      } else {
        ((a: never) => {})(props);
        throw new Error("Unsupported input type");
      }
    },
    validate() {
      return doValidateCurrentValidators({ force: true });
    },
    silentlyValidate() {
      return doValidateCurrentValidators({ force: true, silent: true });
    },
    metaInfoStore: uiStore,
    ...dataStore,
  };
}

type Unsubscribe = () => void;
function createSimpleEmitter() {
  const listeners = new Map<Function, Function>();

  return {
    emit(newVal: any) {
      listeners.forEach((fn) => {
        fn(newVal);
      });
    },
    onChange(fn: (newVal: any) => any): Unsubscribe {
      listeners.set(fn, fn);
      return () => {
        listeners.delete(fn);
      };
    },
  };
}

let id = 1;
function useId() {
  return useState(() => String(id++))[0];
}
