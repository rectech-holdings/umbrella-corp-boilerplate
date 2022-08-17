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
            navigate(PATHS.main.tab_1.tab_1_stack_home, {});
          }}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Button
          title="Tab 2"
          onPress={() => {
            navigate(PATHS.main.tab_2, {});
          }}
        />
      </View>
    </View>
  );
}
