import { defineConfig } from "vite";
import _ from "lodash";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [{ find: "react-native", replacement: "react-native-web" }],
  },
  define: {
    "process.env": process.env,
  },
  build: {
    outDir: "build",
  },
});
