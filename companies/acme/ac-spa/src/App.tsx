import { useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import { publicConfig } from "./config/public/index.js";
import { createRouter } from "rn-typed-router";

const { Navigator, navigate, PATHS } = createRouter({
  type: "switch",
  routes: {
    login: {
      type: "leaf",
      Component: () => (
        <div
          onClick={() => {
            navigate(PATHS.main, {});
          }}
        >
          Login screen foos
        </div>
      ),
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
