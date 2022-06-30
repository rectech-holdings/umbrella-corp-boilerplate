import { execaCommand } from "execa";
import fs from "fs";

await new Promise((res) => {
  console.info("Starting postgres via Docker...");
  const proc = execaCommand(
    "docker run --expose 5432 -p 5432:5432 -e POSTGRES_PASSWORD=password -v $(pwd)/.pgdata:/var/lib/postgresql/data postgres",
    {
      buffer: false,
      shell: true,
      all: true,
    }
  );

  proc.all.on("data", (d) => {
    const msg = String(d);
    if (msg.match(/ready to accept/i)) {
      res();
    }

    if (msg.match(/error/)) {
      console.error(msg);
    }
  });

  process.on("SIGABRT", () => proc.cancel());
  process.on("SIGINT", () => proc.cancel());
});

const devEnv = String(fs.readFileSync(new URL("../.env", import.meta.url)))
  .split("\n")
  .join(" ");

const migrateProc = execaCommand(`${devEnv} yarn prisma migrate deploy`, {
  shell: true,
  env: false,
  all: true,
  stderr: process.stderr,
});

migrateProc.all.on("data", (d) => {
  const msg = String(d);
  if (msg.match(/applying migration/i)) {
    console.info(msg);
  }

  if (msg.match(/error/)) {
    console.error(msg);
  }
});

console.info("Postgres ready to accept connections on port 5432");
