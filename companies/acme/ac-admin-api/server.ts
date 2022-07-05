import * as api from "./endpoints";
import { attachApiToAppWithDefault } from "create-typed-sdk/core";
import cors from "fastify-cors";

import Fastify from "fastify";
import { publicConfig } from "./config/public";
const app = Fastify();

app.register(cors, { origin: "*" });

app.get("/hello", (req, resp) => {
  resp.send({ success: true });
});

attachApiToAppWithDefault(api, app);

const { port } = await publicConfig;

app.listen(port, function (err, address) {
  if (err) {
    console.error(err);
    process.exit(1);
  } else {
    setTimeout(() => {
      console.info("Acme admin app api listening on port", port);
    }, 1000);
  }
});
