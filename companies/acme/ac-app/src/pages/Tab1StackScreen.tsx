import { View, Button, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PATHS, goBack, useParams, BlockLink } from "../Router.js";

export default function Tab1StackScreen() {
  const { someParam } = useParams(PATHS.main.tab_1.tab_1_stack_screen);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "red" }}>
      <Text>Tab 1 Stack Screen ({someParam})</Text>
      <BlockLink path={PATHS.main.tab_1.tab_1_stack_screen} params={{ someParam: 123 }}>
        <Text>Click to Login</Text>
      </BlockLink>
      <Button
        onPress={() => {
          goBack();
        }}
        title="Go Back"
      />
    </SafeAreaView>
  );
}
