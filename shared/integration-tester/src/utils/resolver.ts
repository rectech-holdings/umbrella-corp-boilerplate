import path from "path";

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
const assetsRegex = new RegExp(`\\.(` + KNOWN_ASSET_TYPES.join("|") + `)(\\?.*)?$`, "i");
const noopFilePath = path.join(__dirname, "noop.js");
const noopObjFilePath = path.join(__dirname, "noop-proxy-obj.js");
const origPathResolve = path.resolve;
path.resolve = (...args) => {
  const lastPath = args[args.length - 1];
  if (lastPath?.match(/\.module\.css/i)) {
    return noopObjFilePath;
  }
  if (lastPath?.match(assetsRegex)) {
    return noopFilePath;
  }

  return origPathResolve(...args);
};
