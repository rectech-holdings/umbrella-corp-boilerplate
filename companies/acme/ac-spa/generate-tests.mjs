import fs from "fs";
import path from "path";

fs.rmSync(path.join(process.cwd(), `src/tests`), { recursive: true, force: true });
fs.mkdirSync(path.join(process.cwd(), `src/tests`));
Array.from(new Array(1000).keys()).forEach((i) => {
  fs.writeFileSync(
    path.join(process.cwd(), `src/tests/test-${i}.test.tsx`),
    `
import App from "../App.js";

test.concurrent("Test ${i}", async () => {
  await new Promise((res) => setTimeout(res, Math.random() * 5));
  expect(true).toBe(true);
})

  `,
  );
});
