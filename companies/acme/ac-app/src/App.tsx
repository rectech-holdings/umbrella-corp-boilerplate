import { Suspense, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView, BorderlessButton } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle } from "react-native-reanimated";
import { createApiReactSDK } from "ac-api";

let Acme: Awaited<ReturnType<typeof createApiReactSDK>>;
const AcmeProm = createApiReactSDK().then((a) => {
  Acme = a;
});

import { StyleSheet, Text, View } from "react-native";
import { Navigator } from "./Router.js";

export default function App() {
  return (
    <Suspense>
      <AppInner />
    </Suspense>
  );
}

function AppInner() {
  if (!Acme) {
    throw AcmeProm;
  }

  return (
    <Acme.SDKProvider>
      <SafeAreaProvider style={{ flex: 1 }} testID="a">
        <GestureHandlerRootView style={{ flex: 1 }} testID="b">
          <Navigator />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </Acme.SDKProvider>
  );
}

function SomeComponent() {
  const { data } = Acme.useSDK().loans.getAllLoans({});

  return (
    <BorderlessButton
      onPress={() => {
        console.log("WADDUP!!!!");
      }}
    >
      <Text>GESTURE HANDLER BUTTOn</Text>
    </BorderlessButton>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
