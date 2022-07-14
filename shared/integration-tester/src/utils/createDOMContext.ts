import { Window as HappyDomWindow } from "happy-dom";

export function createDOMContext() {
  const window = new HappyDomWindow();
  Object.assign(window, {
    global: window,
    globalThis: window,
    process,
    _$_$_TEST_RESULT_$_$_: "",
  });

  return window;
}
