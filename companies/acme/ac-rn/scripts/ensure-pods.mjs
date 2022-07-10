import fs from "fs";

const mustInstallPods = fs.existsSync("./ios/Pods")
  ? fs.readFileSync("./ios/Pods/Manifest.lock").toString() !== fs.readFileSync("./ios/Podfile.lock").toString()
  : true;

process.exit(Number(mustInstallPods));
