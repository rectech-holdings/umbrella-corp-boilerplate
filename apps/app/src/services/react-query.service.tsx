import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "react-query";

export const queryClient = new QueryClient();

export const ReactQueryProvider = (p: { children: ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>{p.children}</QueryClientProvider>
  );
};
