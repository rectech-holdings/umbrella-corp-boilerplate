import { useState, ForwardedRef, forwardRef, ReactNode, Component } from "react";
import { Simplify } from "type-fest";
import {
  DevSuppliedInputComponent,
  DevSuppliedSelectComponent,
  UseForm,
  InputProps,
  SelectProps,
  UseFormReturnValue,
  CreateWhitelabelFormReturnValue,
  CreateWhiteLabelFormOptions,
} from "../types/Form.js";
import { createFormStore } from "./Store.js";

const DefaultDevSuppliedInput: DevSuppliedInputComponent<{}> = (p) => {
  return (
    <>
      <input ref={p.forwardedRef} {...p.native} />
      {p.errors ? p.errors.map((a) => <span>{a}</span>) : null}
    </>
  );
};

const DefaultDevSuppliedSelect: DevSuppliedSelectComponent<{}, unknown> = (a) => {
  return (
    <select ref={a.forwardedRef}>
      {a.options.map((b) => (
        <option value={b.key}>{b.label || (b.value as string)}</option>
      ))}
    </select>
  );
};

export function createWhitelabelForm<ExtraProps extends object>(
  a: CreateWhiteLabelFormOptions<ExtraProps>,
): CreateWhitelabelFormReturnValue<ExtraProps> {
  const Input: DevSuppliedInputComponent<any> = a.components?.Input ?? DefaultDevSuppliedInput;
  const Select: DevSuppliedSelectComponent<any, unknown> = a.components?.Select ?? DefaultDevSuppliedSelect;

  const useForm: UseForm<ExtraProps> = (b) => {
    const [useFormRetVal] = useState(() => {
      const { useRegisterForm, useStoreValue, ...store } = createFormStore<ExtraProps>(b);

      const InputWrapper: (a: InputProps<ExtraProps, {}>, ref: ForwardedRef<HTMLInputElement>) => JSX.Element | null = (
        c,
        ref,
      ) => {
        const { nativeProps, errors } = useRegisterForm({ ...c, formControlType: "input" });
        return <Input forwardedRef={ref} native={nativeProps} errors={errors} />;
      };

      const SelectWrapper: (
        a: SelectProps<ExtraProps, {}, unknown>,
        ref: ForwardedRef<HTMLSelectElement>,
      ) => JSX.Element | null = (c, ref) => {
        const { nativeProps, errors } = useRegisterForm({ ...c, formControlType: "select" });

        return <Select options={c.opts.options} forwardedRef={ref} native={nativeProps as any} errors={errors} />;
      };

      const useFormRet: UseFormReturnValue<ExtraProps, any> = {
        Input: forwardRef(InputWrapper) as any,
        Select: forwardRef(SelectWrapper) as any,
        useStoreValue,
        store,
      };

      return useFormRet;
    });

    return useFormRetVal;
  };

  const ret: CreateWhitelabelFormReturnValue<ExtraProps> = {
    useForm,
  };

  return ret;
}

const { useForm } = createWhitelabelForm({
  type: "dom",
  components: {
    Input: (a) => {
      return <input />;
    },
  },
});

function App() {
  const { Input } = useForm({ initState: { blah: "" } });
  <Input opts={{ field: (s) => s.blah }} />;
}
