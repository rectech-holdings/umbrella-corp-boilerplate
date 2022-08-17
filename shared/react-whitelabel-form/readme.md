# React Whitelabel Form

Let's you easily create strongly typed forms you can customize to your particular use case.

## Example

```tsx
import {
  createUseWhitelabelForm,
  createWhitelabelComponent,
  createWhitelabelComponentWithOptions,
} from "react-whitelabel-form";

type InputProps = React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;
type SelectProps = React.DetailedHTMLProps<React.SelectHTMLAttributes<HTMLSelectElement>, HTMLSelectElement>;

const useAcmeForm = createUseWhitelabelForm({
  Select: createWhitelabelComponentWithOptions<{ label: string } & SelectProps, { label: string; key: string }>((p) => {
    const { onChangeValue, onChange, ...rest } = p;
    return (
      <select
        {...rest}
        value={p.options.find((o) => o.key === p.value)?.key}
        onChange={(e) => {
          p.onChangeValue(p.options.find((o) => o.key === e.target.value)?.value);
          onChange?.(e);
        }}
      >
        {p.options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }),
  Input: createWhitelabelComponent<{ label: string } & InputProps, string>((p) => {
    const { label, onChangeValue, onChange, errors, ...rest } = p;

    return (
      <div>
        <label>{label}</label>
        <input
          {...rest}
          onChange={(e) => {
            p.onChangeValue(e.target.value);
            onChange?.(e);
          }}
        />
        {errors.length ? <div>{errors[0]}</div> : null}
      </div>
    );
  }),
});

function App() {
  const { Input, Select, store, useStoreValue } = useAcmeForm({
    initState: { text: "", selectVal: { complexVal: 123 } },
  });

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!store.validate()) {
          return;
        }

        const data = store.get();
        //Do something with the data...

        store.reset();
      }}
    >
      <Select
        options={[
          { key: "1", label: "Option 1", value: { complexVal: 123 } },
          { key: "2", label: "Option 2", value: { complexVal: 234 } },
          { key: "3", label: "Option 3", value: { complexVal: 345 } },
        ]}
        field={(s) => s.selectVal}
        label={"Select Option"}
      />
      <Input required field={(s) => s.text} label="Loan Id" />
    </form>
  );
}
```
