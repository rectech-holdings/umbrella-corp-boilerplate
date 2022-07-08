import { createServer } from "vite";
import { publicConfig } from "./config/public";

(async () => {
  const server = await createServer({
    clearScreen: false,
  });
  const port = (await publicConfig).port;
  await server.listen(port);

  setTimeout(() => {
    console.info(`Acme Admin SPA ready to accept requests at http://localhost:${port}`);
  }, 5000);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
