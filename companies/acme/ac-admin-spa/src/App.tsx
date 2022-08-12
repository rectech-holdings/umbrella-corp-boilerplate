import { createApiReactSDK } from "ac-api";
import { Suspense, useState } from "react";
import "./App.css";

let SDK: Awaited<ReturnType<typeof createApiReactSDK>>;
const sdkProm = createApiReactSDK().then((a) => {
  SDK = a;
});

function App() {
  return (
    <Suspense fallback={null}>
      <AppInner />
    </Suspense>
  );
}

function AppInner() {
  if (!SDK) {
    throw sdkProm;
  }

  const [loanId, setLoanId] = useState(123);

  const resp = SDK.useSDK().loans.getLoan(loanId);

  if (resp.status === "error") {
    return <div>Error fetching data</div>;
  } else if (resp.status === "loading") {
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
