import { createServer } from "vite";
import { publicConfig } from "./config/public";

const server = await createServer({
  clearScreen: false,
});

await server.listen(publicConfig.port);

setTimeout(() => {
  console.info(`Acme SPA web app ready to accept requests at http://localhost:${publicConfig.port}`);
}, 5000);
