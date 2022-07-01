import * as api from "./endpoints";
import { attachApiToAppWithDefault } from "create-typed-sdk/core";
import cors from "fastify-cors";

import Fastify from "fastify";
const app = Fastify();

app.register(cors, { origin: "*" });

app.get("/hello", (req, resp) => {
  resp.send({ success: true });
});

attachApiToAppWithDefault(api, app);

const PORT = process.env["PORT"] || 3250;
app.listen(PORT, function (err, address) {
  if (err) {
    console.error(err);
    process.exit(1);
  } else {
    console.info("Admin api listening on port", PORT);
  }
});
