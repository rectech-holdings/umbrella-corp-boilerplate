import * as api from "./endpoints/index.js";
import { attachApiToAppWithDefault } from "create-typed-sdk/core";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { publicConfig } from "./config/public/index.js";

(async () => {
  const app = Fastify();

  await app.register(cors, { origin: "*" });

  attachApiToAppWithDefault(api, app);

  const { port } = await publicConfig;

  app.listen({ port }, function (err, address) {
    if (err) {
      console.error(err);
      process.exit(1);
    } else {
      setTimeout(() => {
        console.info("Acme app api listening on port", port);
      }, 1000);
    }
  });
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
