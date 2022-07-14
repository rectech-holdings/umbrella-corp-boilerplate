/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react({
      fastRefresh: process.env.NODE_ENV !== "test",
    }),
  ],
  build: {
    outDir: "build",
  },
  test: {
    environment: "node",
    globals: true,
    isolate: false,
    passWithNoTests: false,
    maxConcurrency: Infinity,
  },
});
