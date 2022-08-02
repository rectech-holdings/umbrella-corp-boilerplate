import React from "react";
import {
  BackHandler as RNWBackHandler,
  Platform as RNWPlatform,
  Keyboard as RNWKeyboard,
  StyleSheet as RNWStyleSheet,
  View as RNWView,
  //@ts-ignore
} from "react-native-web";

import type {
  BackHandler as RNBackHandler,
  Keyboard as RNKeyboard,
  Platform as RNPlatform,
  StyleSheet as RNStyleSheet,
  View as RNView,
} from "react-native";

import type {
  Screen as RNScreen,
  ScreenContainer as RNScreenContainer,
  ScreenStack as RNScreenStack,
} from "react-native-screens";

function Div(a: any) {
  return React.createElement("div", a);
}

export const BackHandler: typeof RNBackHandler = RNWBackHandler;
export const Platform: typeof RNPlatform = RNWPlatform;
export const Keyboard: typeof RNKeyboard = RNWKeyboard;
export const StyleSheet: typeof RNStyleSheet = RNWStyleSheet;
export const View: typeof RNView = RNWView;
export const Screen: typeof RNScreen = RNWView;
export const ScreenContainer: typeof RNScreenContainer = RNWView;
export const ScreenStack: typeof RNScreenStack = RNWView;
