// Probably switch back to vanilla app entry rather than this weird file once this bug is resolved
// https://stackoverflow.com/questions/71668256/deprecation-notice-reactdom-render-is-no-longer-supported-in-react-18

import App from "./App.js";
import "expo/build/Expo.fx";
import { AppRegistry, Platform } from "react-native";
import { createRoot } from "react-dom/client";
import { activateKeepAwake } from "expo-keep-awake";
import withExpoRoot from "expo/build/launch/withExpoRoot";

if (__DEV__) {
  activateKeepAwake().catch(console.error);
}

AppRegistry.registerComponent("main", () => withExpoRoot(App));

if ("web" === Platform.OS) {
  const rootTag = createRoot(document.getElementById("root") ?? document.getElementById("main"));

  const RootComponent = withExpoRoot(App);
  rootTag.render(<RootComponent />);
}
