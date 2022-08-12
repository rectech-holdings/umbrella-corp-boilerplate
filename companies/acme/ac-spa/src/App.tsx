import { Suspense, useEffect, useId, useInsertionEffect, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import { View } from "react-native";
import { publicConfig } from "./config/public/index.js";
import { createApiReactSDK } from "ac-api";
import { createRouter } from "rn-typed-router";
import {
  createUseWhitelabelForm,
  createWhitelabelComponent,
  createWhitelabelComponentWithOptions,
} from "react-whitelabel-form";

type InputProps = React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;
type SelectProps = React.DetailedHTMLProps<React.SelectHTMLAttributes<HTMLSelectElement>, HTMLSelectElement>;

let Acme: Awaited<ReturnType<typeof createApiReactSDK>>;
const AcmeProm = createApiReactSDK().then((a) => {
  Acme = a;
});

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

const { Navigator, navigate, PATHS } = createRouter({
  type: "switch",
  routes: {
    login: {
      type: "leaf",
      Component: () => {
        const { data } = Acme.useSDK().loans.getAllLoans({});

        const { Input, Select, store, useStoreValue } = useAcmeForm({
          initState: { text: "", selectVal: { complexVal: 123 } },
        });

        return (
          <div>
            <View>
              <span>INSIDE A VIEW</span>
            </View>
            <div>Login screen</div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!store.validate()) {
                  return;
                }

                await Acme.SDK.loans.createLoan(
                  {
                    loanTitle: store.get().text,
                    ownerEmail: Math.random().toString().slice(2) + "asdf@asdf.com",
                  },
                  {
                    invalidate: [Acme.getQueryKey.loans()],
                  },
                );

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
            <button
              onClick={() => {
                navigate(PATHS.main.dashboard, {});
              }}
            >
              Navigate to main
            </button>
            {data?.map((a) => (
              <div key={a.id}>{a.title}</div>
            ))}
          </div>
        );
      },
    },
    main: {
      type: "switch",
      keepChildrenMounted: true,
      routes: {
        dashboard: {
          type: "leaf",
          Component: () => (
            <div
              onClick={() => {
                navigate(PATHS.main.chat, {});
              }}
            >
              Main screen foos
            </div>
          ),
        },
        chat: {
          type: "leaf",
          Component: () => (
            <div
              onClick={() => {
                navigate(PATHS.main.dashboard, {});
              }}
            >
              Chat screen foos
            </div>
          ),
        },
      },
    },
  },
});

function App() {
  return (
    <Suspense>
      <AppInner />
    </Suspense>
  );
}

function AppInner() {
  if (!Acme) {
    throw AcmeProm;
  }

  const [count, setCount] = useState(0);

  return (
    <Acme.SDKProvider>
      <Navigator />
    </Acme.SDKProvider>
  );
}

export default App;
