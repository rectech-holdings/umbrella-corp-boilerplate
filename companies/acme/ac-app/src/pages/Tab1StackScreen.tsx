import { View, Button, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PATHS, goBack, useParams } from "../Router.js";

export default function Tab1StackScreen() {
  const { someParam } = useParams(PATHS.MAIN.TAB_1.TAB_1_STACK_SCREEN);
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Text>Tab 1 Stack Screen ({someParam})</Text>
      <Button
        onPress={() => {
          goBack();
        }}
        title="Go Back"
      />
    </SafeAreaView>
  );
}
