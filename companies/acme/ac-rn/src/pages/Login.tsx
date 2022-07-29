import { View, Button, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { PATHS, navigate } from "../Router.js";
const singleTap = Gesture.Tap()
  .maxDuration(250)
  .onStart(() => {
    console.log("Single tap!");
  });

const doubleTap = Gesture.Tap()
  .numberOfTaps(2)
  .onStart(() => {
    console.log("Yay, double tap!");
  });

export default function Login() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Text>This is the Login Page</Text>
      <View>
        <GestureDetector gesture={Gesture.Exclusive(doubleTap, singleTap)}>
          <View style={{ width: 100, height: 100, backgroundColor: "pink" }} />
        </GestureDetector>
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
