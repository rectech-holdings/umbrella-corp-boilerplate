import { View, Button, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PATHS, navigate } from "../Router.js";
export default function MainTabBar() {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        paddingBottom: insets.bottom,
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "pink",
      }}
    >
      <View style={{ flex: 1 }}>
        <Button
          title="Tab 1"
          onPress={() => {
            navigate(PATHS.MAIN.TAB_1.TAB_1_STACK_HOME, {});
          }}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Button
          title="Tab 2"
          onPress={() => {
            navigate(PATHS.MAIN.TAB_2, {});
          }}
        />
      </View>
    </View>
  );
}
