import { RN_APP_ROOT_ROUTE_DEFINITION } from "ac-shared-universal";
import React, { ReactNode, Suspense } from "react";

import Login from "./pages/Login.js";
import MainTabBar from "./pages/MainTabBar.js";
import Tab1StackHome from "./pages/Tab1StackHome.js";
import Tab1StackScreen from "./pages/Tab1StackScreen.js";
import Tab2 from "./pages/Tab2.js";

import { createRouter, extendNonUIRouteDefinition } from "rn-typed-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Text, View } from "react-native";

const routeDef = extendNonUIRouteDefinition(RN_APP_ROOT_ROUTE_DEFINITION, {
  type: "switch",
  routes: {
    LOGIN: {
      type: "leaf",
      Component: Login,
    },
    MAIN: {
      type: "tab",
      BottomTabBar: MainTabBar,
      routes: {
        TAB_1: {
          type: "stack",
          routes: {
            TAB_1_STACK_HOME: {
              type: "leaf",
              Component: Tab1StackHome,
            },
            TAB_1_STACK_SCREEN: {
              type: "leaf",
              Component: Tab1StackScreen,
            },
          },
        },
        TAB_2: {
          type: "leaf",
          Component: Tab2,
        },
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
} = createRouter<typeof routeDef>(routeDef);
