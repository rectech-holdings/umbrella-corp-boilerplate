import { useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import { publicConfig } from "./config/public/index.js";
import { createApiReactSDK } from "ac-api";
import { createRouter } from "rn-typed-router";

const { ApiSDK } = createApiReactSDK();

const { Navigator, navigate, PATHS } = createRouter({
  type: "switch",
  routes: {
    login: {
      type: "leaf",
      Component: () => {
        const { data } = ApiSDK.useEndpoint().loans.getAllLoans({});
        return (
          <div>
            <div>Login screen</div>
            <button
              onClick={async () => {
                const asdf = { revalidate: [ApiSDK.getQueryKey.loans.getAllLoans({})] };
                await ApiSDK.SDK.loans.createLoan({ loanTitle: "asdf", ownerEmail: "asdf" });

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

  return <Navigator />;
}

export default App;
