import { useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import { publicConfig } from "./config/public/index.js";
import { createApiReactSDK } from "ac-api";
import { createRouter } from "rn-typed-router";

const {
  SDK: AcmeSDK,
  useSDK: useAcmeSDK,
  usePaginatedSDK: useAcmePaginatedSDK,
  SDKProvider: AcmeSDKProvider,
  getQueryKey: getAcmeQueryKey,
} = createApiReactSDK();

const { Navigator, navigate, PATHS } = createRouter({
  type: "switch",
  routes: {
    login: {
      type: "leaf",
      Component: () => {
        const { data } = useAcmeSDK().loans.getAllLoans({});
        return (
          <div>
            <div>Login screen</div>
            <button
              onClick={async () => {
                await AcmeSDK.loans.createLoan({ loanTitle: "asdf", ownerEmail: "asdf" });

                navigate(PATHS.main, {});
              }}
            >
              Go to main
            </button>
            {data?.map((a) => (
              <div key={a.id}>{a.id}</div>
            ))}
          </div>
        );
      },
    },
    main: {
      type: "leaf",
      Component: () => (
        <div
          onClick={() => {
            navigate(PATHS.login, {});
          }}
        >
          Main screen foos
        </div>
      ),
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
