import { View, Button, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PATHS, navigate, BlockLink } from "../Router.js";
export default function Tab1StackHome() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "blue" }}>
      <Text>Tab 1</Text>
      <Text>Tab 1</Text>
      <Text>Tab 1</Text>
      <Text>Tab 1</Text>
      <Text>Tab 1</Text>
      <Text>Tab 1</Text>
      <Text>Tab 1</Text>
      <Text>Tab 1</Text>
      <BlockLink path={PATHS.main.tab_1.tab_1_stack_screen} params={{ someParam: 123 }}>
        <Text>Click to Login</Text>
      </BlockLink>
    </SafeAreaView>
  );
}
