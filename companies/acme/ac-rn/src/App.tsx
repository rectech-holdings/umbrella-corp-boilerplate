import { createApiSDK } from "ac-api";
import { Button, SafeAreaView, Text, View } from "react-native";

import { Navigator } from "./Router.js";

const sdk = createApiSDK();

export default function App() {
  return <Navigator />;
}
