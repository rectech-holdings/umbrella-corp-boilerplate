import { useState } from "react";
import "./App.css";
import { createAdminApiSDK } from "@umbrella-corp/acme-admin-api";
import { QueryClient, QueryClientProvider } from "react-query";

const queryClient = new QueryClient();

const { AdminApiSDK } = createAdminApiSDK(queryClient);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  );
}

function AppInner() {
  const [loanId, setLoanId] = useState("asdasdfasdf");

  const resp = AdminApiSDK.useEndpoint().getLoan({ loanId: loanId });

  if (resp.status === "error") {
    return <div>Error fetching data</div>;
  } else if (resp.status === "loading" || resp.status === "idle") {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div>Fetched loan: {resp.data.coolLoan.loanId}</div>
      <button
        onClick={() => {
          setLoanId(Math.random().toString());
        }}
      >
        Press to randomly change loan id
      </button>
    </div>
  );
}

export default App;
