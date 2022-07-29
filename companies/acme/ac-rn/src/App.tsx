import { createApiSDK } from "ac-api";
import React, { Suspense } from "react";
import { Button, SafeAreaView, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Navigator } from "./Router.js";

const sdk = createApiSDK();

export default function App() {
  return (
    <Suspense
      fallback={
        <View style={{ flex: 1, backgroundColor: "pink" }}>
          <Text>Loading...</Text>
        </View>
      }
    >
      <SafeAreaProvider>
        <Navigator />
      </SafeAreaProvider>
    </Suspense>
  );
}
