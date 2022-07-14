const KNOWN_ASSET_TYPES = [
  // styles
  "css",
  "scss",
  "sass",
  "less",

  // images
  "png",
  "jpe?g",
  "jfif",
  "pjpeg",
  "pjp",
  "gif",
  "svg",
  "ico",
  "webp",
  "avif",

  // media
  "mp4",
  "webm",
  "ogg",
  "mp3",
  "wav",
  "flac",
  "aac",

  // fonts
  "woff2?",
  "eot",
  "ttf",
  "otf",
  // other
  "webmanifest",
  "pdf",
  "txt",
];
const { Window } = require("happy-dom");
const path = require("path");
const noopFilePath = path.join(__dirname, "noop.js");
const noopObjFilePath = path.join(__dirname, "noop-proxy-obj.js");
const origPathResolve = path.resolve;
const assetsRegex = new RegExp(`\\.(` + KNOWN_ASSET_TYPES.join("|") + `)(\\?.*)?$`, "i");
path.resolve = (...args) => {
  const lastPath = args[args.length - 1];
  if (lastPath.match(/\.module\.css/i)) {
    return noopObjFilePath;
  }
  if (lastPath.match(assetsRegex)) {
    return noopFilePath;
  }
  return origPathResolve(...args);
};
const { NodeVM } = require("vm2");

executeFile("./dist/App.js");
executeFile("./dist/App.js");
executeFile("./dist/App.js");

function executeFile(filePath) {
  return new NodeVM({
    allowAsync: true,
    sandbox: createContext(),
    require: {
      context: "sandbox",
      builtin: ["*"],
      external: true,
    },
  }).runFile(filePath);
}

function createContext() {
  const window = new Window();
  Object.assign(window, {
    module,
    exports,
    global: window,
    globalThis: window,
    process,
  });

  return window;
}
