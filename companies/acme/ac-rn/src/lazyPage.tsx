import { View, Button, Text } from "react-native";
import { useParams, PATHS, goBack } from "./Router.js";

export default function Burp() {
  const params = useParams(PATHS.bloop.baz.burp);
  return (
    <View style={{ flex: 1, paddingTop: 50 }}>
      <Text>This is the Burp Page</Text>
      <Button
        title="Go Back"
        onPress={() => {
          goBack();
        }}
      />
    </View>
  );
}
