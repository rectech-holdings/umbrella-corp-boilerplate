import * as api from "./endpoints";
import { attachApiToAppWithDefault } from "create-typed-sdk/core";
import cors from "@fastify/cors";

import Fastify from "fastify";
import { publicConfig } from "./config/public";
const app = Fastify();

(async () => {
  await app.register(cors, { origin: "*" });

  app.get("/hello", async (req, resp) => {
    await resp.send({ success: true });
  });

  attachApiToAppWithDefault(api, app);

  const { port } = await publicConfig;

  app.listen({ port }, function (err, address) {
    if (err) {
      console.error(err);
      process.exit(1);
    } else {
      setTimeout(() => {
        console.info("Cyberdyne admin app api listening on port", port);
      }, 1000);
    }
  });
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
