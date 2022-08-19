import { View, Button, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PATHS, navigate, BlockLink } from "../Router.js";
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
        <BlockLink style={{ height: 50 }} path={PATHS.main.tab_1.tab_1_stack_home} params={{}}>
          <Text>Tab 1</Text>
        </BlockLink>
      </View>
      <View style={{ flex: 1 }}>
        <BlockLink style={{ height: 50 }} path={PATHS.main.tab_2} params={{}}>
          <Text>Tab 2</Text>
        </BlockLink>
      </View>
    </View>
  );
}
