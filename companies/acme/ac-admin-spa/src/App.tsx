import { createApiReactSDK } from "ac-api";
import { useState } from "react";
import "./App.css";

const { ApiSDK } = createApiReactSDK();

function App() {
  return <AppInner />;
}

function AppInner() {
  const [loanId, setLoanId] = useState(123);

  const resp = ApiSDK.useSDK().loans.getLoan(loanId);

  if (resp.status === "error") {
    return <div>Error fetching data</div>;
  } else if (resp.status === "loading" || resp.status === "idle") {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div>Fetched loan: {resp.data?.id}</div>
      <button
        onClick={() => {
          setLoanId(Math.random());
        }}
      >
        Press to randomly change loan id
      </button>
    </div>
  );
}

export default App;
