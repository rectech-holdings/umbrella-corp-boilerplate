import logo from "./logo.svg";
import "./App.css";
import { Providers } from "./services/Providers";
import { ApiSDK } from "./services/apiSDK.service";
import { Router } from "./routes/Router";
import { SideNav } from "./components/sideNav";
import Header from "./components/header";

function App() {
  return (
    <Providers>
      <AppInner />
    </Providers>
  );
}

function AppInner() {
  const loans = ApiSDK.useEndpoint().loans.getAllLoans({});

  const someData = [1, 2, 3, 4, 5];

  if (loans.status !== "success") {
    return (
    <div>
      <Header />
      <div>Loading...</div>
    </div>
    );
  }

  return (
    <div>
      <Header />
      <SideNav />
      <Router />
    </div>
    );
}

export default App;
