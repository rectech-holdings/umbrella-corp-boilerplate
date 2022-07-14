import { URL } from "url";

export async function resolve(url: string, context: any, nextResolve: any) {
  if (url.endsWith(".module.css")) {
    return {
      shortCircuit: true,
      url: new URL("noop-proxy-obj.js", import.meta.url).href,
    };
  }

  if (url.endsWith(".css")) {
    return {
      shortCircuit: true,
      url: new URL("noop.js", import.meta.url).href,
    };
  }

  return nextResolve(url, context, nextResolve);
}
