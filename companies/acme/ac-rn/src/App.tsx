import React, { Suspense } from "react";
// import { createApiSDK } from "ac-api";
// import { Button, SafeAreaView, Text, View } from "react-native";
// import { GestureHandlerRootView } from "react-native-gesture-handler";
// import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, Text } from "react-native";

// import { Navigator } from "./Router.js";

export default function App() {
  return (
    <View>
      <Text>Hello World</Text>
    </View>
  );
  // return (
  //   <Suspense
  //     fallback={
  //       <View style={{ flex: 1, backgroundColor: "pink" }}>
  //         <Text>Loading...</Text>
  //       </View>
  //     }
  //   >
  //     <GestureHandlerRootView style={{ flex: 1 }}>
  //       <SafeAreaProvider>
  //         <Navigator />
  //       </SafeAreaProvider>
  //     </GestureHandlerRootView>
  //   </Suspense>
  // );
}
