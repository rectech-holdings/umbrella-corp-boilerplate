import { View, Button, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PATHS, navigate } from "../Router.js";

export default function Login() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Text>This is the Login Page</Text>
      </View>

      <Button
        onPress={() => {
          navigate(PATHS.MAIN.TAB_1.TAB_1_STACK_HOME, {});
        }}
        title="Click to Login"
      />
    </SafeAreaView>
  );
}
