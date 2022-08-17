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
```
