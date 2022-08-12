import { defineConfig } from "vite";
import _ from "lodash";
import react from "@vitejs/plugin-react";
import fs, { existsSync } from "fs";

const extensions = [".web.tsx", ".tsx", ".web.ts", ".ts", ".web.jsx", ".jsx", ".web.js", ".js", ".css", ".json"];

export default defineConfig({
  plugins: [
    {
      name: "platform-extensions",
      enforce: "pre",
      async resolveId(id, importer) {
        const [file] = id.split("?");
        const resolved = await this.resolve(file, importer, { skipSelf: true });
        if (resolved) {
          const webExtensionAlt = resolved.id.replace(/(\.[mc]?js)$/, ".web$1");
          if (existsSync(webExtensionAlt)) {
            return { ...resolved, id: webExtensionAlt };
          }
        }
      },
    },
    react(),
  ],
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        ".js": "jsx",
      },

      resolveExtensions: extensions,
    },
  },
  resolve: {
    alias: [
      { find: "react-native", replacement: "react-native-web" },
      { find: "react-native/Libraries/Utilities/codegenNativeComponent", replacement: "" },
    ],
  },
  define: {
    "process.env": process.env,
  },
  build: {
    outDir: "build",
  },
});
