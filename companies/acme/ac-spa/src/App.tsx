import { useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import { publicConfig } from "./config/public/index.js";
import { createApiReactSDK } from "ac-api";
import { createRouter } from "rn-typed-router";
import { createUseWhitelabelForm, createWhitelabelComponent } from "react-whitelabel-form";

type InputProps = React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;

const useAcmeForm = createUseWhitelabelForm({
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

const {
  SDK: AcmeSDK,
  useSDK: useAcmeSDK,
  usePaginatedSDK: useAcmePaginatedSDK,
  SDKProvider: AcmeSDKProvider,
  getQueryKey: getAcmeQueryKey,
} = createApiReactSDK({});

const { Navigator, navigate, PATHS } = createRouter({
  type: "switch",
  routes: {
    login: {
      type: "leaf",
      Component: () => {
        const { data } = useAcmeSDK().loans.getAllLoans({});

        const { Input, store } = useAcmeForm({ initState: { text: "" } });

        return (
          <div>
            <div>Login screen</div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!store.validate()) {
                  return false;
                }

                // await AcmeSDK.loans.createLoan(
                //   {
                //     loanTitle: store.get().text,
                //     ownerEmail: Math.random().toString().slice(2) + "asdf@asdf.com",
                //   },
                //   {
                //     invalidate: [getAcmeQueryKey.loans()],
                //   },
                // );

                store.reset();

                // navigate(PATHS.main.dashboard, {});

                return false;
              }}
            >
              <Input required field={(s) => s.text} label="Loan Id" />
            </form>
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

publicConfig.then((a) => {}).catch((e) => {});

function App() {
  const [count, setCount] = useState(0);

  return (
    <AcmeSDKProvider>
      <Navigator />
    </AcmeSDKProvider>
  );
}

export default App;
