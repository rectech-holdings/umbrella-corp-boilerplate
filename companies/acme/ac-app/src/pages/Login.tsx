import { View, Button, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PATHS, navigate } from "../Router.js";

export default function Login() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "pink" }}>
      <View style={{ flex: 1 }}>
        <Text>This is the Login Page</Text>
      </View>

      <Button
        onPress={() => {
          navigate(PATHS.main.tab_1.tab_1_stack_home, {});
        }}
        title="Click to Login"
      />
    </SafeAreaView>
  );
}
