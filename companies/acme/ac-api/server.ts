import * as api from "./endpoints";
import { attachApiToAppWithDefault } from "create-typed-sdk/core";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { publicConfig } from "./config/public";

const app = Fastify();

await app.register(cors, { origin: "*" });

attachApiToAppWithDefault(api, app);

const { port } = publicConfig;

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
