import { View, Button, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PATHS, navigate } from "../Router.js";
export default function Tab1StackHome() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Text>Tab 1</Text>
      <Button
        onPress={() => {
          navigate(PATHS.MAIN.TAB_1.TAB_1_STACK_SCREEN, { someParam: 123 });
        }}
        title="Push Stack Screen"
      />
    </SafeAreaView>
  );
}
