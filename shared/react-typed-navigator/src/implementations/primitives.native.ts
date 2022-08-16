export { BackHandler, Platform, Keyboard, StyleSheet, View } from "react-native";
export { Screen, ScreenContainer, ScreenStack } from "react-native-screens";

export const history = new Proxy(
  {},
  {
    get() {},
  },
);
