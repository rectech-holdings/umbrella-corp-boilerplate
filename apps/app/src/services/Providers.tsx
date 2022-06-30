import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "react-query";

import { BrowserRouter } from "react-router-dom";
import { ReactQueryProvider } from "./react-query.service";

export function Providers(p: { children: ReactNode }) {
  return (
    <BrowserRouter>
      <ReactQueryProvider>{p.children}</ReactQueryProvider>
    </BrowserRouter>
  );
}
