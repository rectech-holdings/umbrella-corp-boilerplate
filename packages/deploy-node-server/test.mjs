import { spawn } from "child_process";
const shell = spawn("sh", ["gcloud", "run", "deploy"], { stdio: "inherit" });
shell.on("close", (code) => {
  console.log("[shell] terminated :", code);
});
