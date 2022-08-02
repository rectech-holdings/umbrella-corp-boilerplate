import { defineConfig } from "vite";
import _ from "lodash";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    "process.env": process.env,
  },
  build: {
    outDir: "build",
  },
});
