import { Suspense, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle } from "react-native-reanimated";
import { createApiReactSDK } from "ac-api";

let Acme: Awaited<ReturnType<typeof createApiReactSDK>>;
const AcmeProm = createApiReactSDK().then((a) => {
  Acme = a;
});

import { StyleSheet, Text, View } from "react-native";

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
      <SafeAreaProvider style={{ flex: 1 }}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={styles.container}>
            <Text>Open up App.js to start working on your app!!!</Text>
            <StatusBar style="auto" />
            <SomeComponent />
          </View>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </Acme.SDKProvider>
  );
}

function SomeComponent() {
  useEffect(() => {
    Acme.SDK.loans.getAllLoans({}).then((a) => {
      console.log(a);
    }, console.error);
  }, []);

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
