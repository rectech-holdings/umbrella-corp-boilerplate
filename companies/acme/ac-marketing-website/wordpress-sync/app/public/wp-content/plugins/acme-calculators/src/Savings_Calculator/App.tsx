import zustand from "zustand";

import { useEffect } from "react";

const asdf = zustand(() => ({}));

export function App() {
  useEffect(() => {}, []);
  return <div>Hello world from React</div>;
}
