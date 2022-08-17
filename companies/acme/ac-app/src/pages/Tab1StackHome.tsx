import { View, Button, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PATHS, navigate } from "../Router.js";
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
      <Button
        onPress={() => {
          navigate(PATHS.main.tab_1.tab_1_stack_screen, { someParam: 123 });
        }}
        title="Push Stack Screen"
      />
    </SafeAreaView>
  );
}
