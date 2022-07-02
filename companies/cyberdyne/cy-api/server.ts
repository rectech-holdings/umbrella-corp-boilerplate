import * as api from "./endpoints";
import { collectEndpoints } from "create-typed-sdk/core";
import Fastify from "fastify";
import cors from "fastify-cors";
import { publicConfig } from "./config/public";

const app = Fastify();

app.register(cors, { origin: "*" });

collectEndpoints(api).forEach(({ fn, path }) => {
  app.post("/" + path.join("/"), async (req, resp) => {
    try {
      const val = await fn((req.body as any).argument);
      resp.send(val);
    } catch (e) {
      console.error(e);
      resp.status(500).send({ error: "Error procesing request!!" });
    }
  });
});

const PORT = process.env["PORT"] || 3300;
app.listen(PORT, function (err, address) {
  if (err) {
    console.error(err);
    process.exit(1);
  } else {
    console.info("App api listening on port", PORT);
  }
});
