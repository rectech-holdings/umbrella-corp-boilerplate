import { RN_APP_ROOT_ROUTE_DEFINITION } from "ac-shared-universal";
import { Button, Text, View } from "react-native";

import { createRouter, extendNonUIRouteDefinition, ParamTypes, ParamTypesClass } from "rn-typed-router";

const routeDef = extendNonUIRouteDefinition(RN_APP_ROOT_ROUTE_DEFINITION, {
  type: "stack",
  initialRoute: "withoutParams",
  routes: {
    bloop: {
      type: "tab",
      routes: {
        baz: {
          type: "stack",
          routes: {
            burp: {
              type: "leaf",
              Component: () => {
                const params = useParams(PATHS.bloop.baz.burp);
                return (
                  <View style={{ flex: 1, paddingTop: 50 }}>
                    <Text>This is the Burp Page</Text>
                    <Button
                      title="Go Back"
                      onPress={() => {
                        console.log(getFocusedUrl());
                        goBack();
                        console.log(getFocusedUrl());
                      }}
                    />
                  </View>
                );
              },
            },
          },
        },
      },
    },
    qwer: {
      type: "leaf",
      Component: () => (
        <View style={{ flex: 1 }}>
          <Text>This is the Qwer Page</Text>
        </View>
      ),
    },
    withoutParams: {
      type: "leaf",
      screenProps: {
        screenOrientation: "all",
      },
      Component: () => {
        return (
          <View style={{ flex: 1, paddingTop: 50, backgroundColor: "pink" }}>
            <Text>This is the WithoutParams Page</Text>
            <Button
              onPress={() => {
                navigate(PATHS.bloop.baz.burp, { baz: "qwer", burp: "asdf", bloop: 234 });
              }}
              title="Navigate"
            />
          </View>
        );
      },
    },
  },
});

export const {
  Navigator,
  PATHS,
  generateUrl,
  goBack,
  navigate,
  navigateToUrl,
  reset,
  useFocusEffect,
  useIsFocused,
  useParams,
  getFocusedParams,
  getFocusedUrl,
  subscribeToFocusedUrl,
  useFocusedUrl,
  validateUrl,
} = createRouter(routeDef);
