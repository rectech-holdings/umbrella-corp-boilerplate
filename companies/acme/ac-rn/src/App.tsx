import { createApiSDK } from "ac-api";
import { Button, SafeAreaView, Text } from "react-native";

import { Navigator } from "./Router.js";

const sdk = createApiSDK();

export default function App() {
  return (
    <SafeAreaView>
      <Text>This is the app</Text>
      <Navigator />
    </SafeAreaView>
  );
}
