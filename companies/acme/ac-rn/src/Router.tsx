import { RN_APP_ROOT_ROUTE_DEFINITION } from "ac-shared-universal";
import React from "react";
import { Button, Text, View } from "react-native";

import { createRouter, extendNonUIRouteDefinition } from "rn-typed-router";
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
              Component: React.lazy(() => import("./lazyPage.js")),
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
