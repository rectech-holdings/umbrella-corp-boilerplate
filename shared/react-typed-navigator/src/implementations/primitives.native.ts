export { BackHandler, Platform, Keyboard, StyleSheet, View } from "react-native";
export { Screen, ScreenContainer, ScreenStack } from "react-native-screens";

export const history = new Proxy(
  {},
  {
    get() {
      throw new Error("Unable to access history on native!");
    },
  },
);
