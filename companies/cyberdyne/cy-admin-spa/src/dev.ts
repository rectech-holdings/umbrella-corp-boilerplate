import { createServer } from "vite";
import { publicConfig } from "./config/public";

(async () => {
  const server = await createServer({
    clearScreen: false,
  });

  const port = (await publicConfig).port;
  await server.listen(port);

  setTimeout(() => {
    console.info(`Acme SPA web app ready to accept requests at http://localhost:${port}`);
  }, 2000);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
