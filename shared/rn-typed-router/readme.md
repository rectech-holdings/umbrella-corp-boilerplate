# RN Typed Router

This is a nested router solution meant as a replacement for react-navigation, with a focus on performance and type correctness.

First define your routes in a nested manner (typically in a `router.tsx` file or the like) to create your `Navigator` and navigation functions. Next, render your `Navigator` at the root of your app. Finally, use the navigation constants and functions exported from your route definition (e.g. the exports defined in `router.tsx`) to interact with the router, navigate, get params, etcetera.

## Basic Example:

```tsx
import { Button, Text, View } from "react-native";
import { createRouter, createRouteDefinition, ParamTypes } from "rn-typed-router";
const routeDef = createRouteDefinition({
  type: "tab",
  routes: {
    LOGIN: {
      type: "leaf",
      Component: () => {
        return (
          <View style={{ flex: 1 }}>
            <Text>Login Page</Text>
            <Button
              title="Login"
              onPress={() => {
                navigate(PATHS.MAIN, { someParam: 123 });
              }}
            />
          </View>
        );
      },
    },
    MAIN: {
      type: "leaf",
      params: {
        someParam: ParamTypes.number(),
      },
      Component: () => {
        const { someParam } = useParams(PATHS.MAIN);
        return (
          <View style={{ flex: 1 }}>
            <Text>Main</Text>
          </View>
        );
      },
    },
  },
});

const { Navigator, PATHS, goBack, navigate, useParams } = createRouter(routeDef);

export function App() {
  return <Navigator />;
}
```

## More Complex Example

```tsx
//router.tsx
import { Button, Text, View } from "react-native";

import { createRouter, createRouteDefinition, ParamTypes } from "rn-typed-router";
const routeDef = createRouteDefinition({
  type: "switch",
  routes: {
    LOGIN: {
      type: "leaf",
      Component: import("./Login"),
    },
    MAIN: {
      type: "tab",
      BottomTabBar: import("./MainTabBar"),
      routes: {
        TAB_1: {
          type: "stack",
          routes: {
            TAB_1_STACK_HOME: {
              type: "leaf",
              Component: import("./Tab1StackHome"),
            },
            TAB_1_STACK_SCREEN: {
              //A stack inside of a stack
              type: "stack",
              params: {
                //This parameter can be used by any subroute
                someParam: ParamTypes.number(),
              },
              routes: {
                TAB_1_STACK,
              },
            },
          },
        },
        TAB_2: {
          type: "leaf",
          Component: import("./Tab2"),
        },
      },
    },
  },
});

//NOTE EXPORTS BELOW! These are how params will be consumed and navigation will occur.
export const { Navigator, PATHS, goBack, navigate, useParams } = createRouter(routeDef);

//App.tsx
import { Navigator } from "./router.tsx";
export function App() {
  return <Navigator />;
}

//Login.tsx
import { PATHS, navigate } from "./router.tsx";

export default function Login() {
  return (
    <View style={{ flex: 1 }}>
      <Text>This is the Login Page</Text>
      <Button
        onPress={() => {
          navigate(PATHS.MAIN.TAB_1.TAB_1_STACK_HOME, {});
        }}
        title="Click to Login"
      />
    </View>
  );
}

//MainTabBar.tsx
import { PATHS, navigate } from "./router.tsx";
export default function MainTabBar() {
  return (
    <View style={{ height: 50, flex: 1 }}>
      <Button
        title="Tab 1"
        onPress={() => {
          navigate(PATHS.MAIN.TAB_1.TAB_1_STACK_HOME, {});
        }}
      />
      <Button
        title="Tab 2"
        onPress={() => {
          navigate(PATHS.MAIN.TAB_2, {});
        }}
      />
    </View>
  );
}

//Tab1StackHome.tsx
import { PATHS, navigate } from "./router.tsx";
export default function Tab1StackHome() {
  return (
    <View style={{ flex: 1 }}>
      <Text>Tab 1</Text>
      <Button
        onPress={() => {
          navigate(PATHS.MAIN.TAB_1.TAB_1_STACK_SCREEN, { someParam: 123 });
        }}
        title="Push Stack Screen"
      />
    </View>
  );
}

//Tab1StackScreen.tsx
import { goBack, useParams } from "./router.tsx";
export default function Tab1StackScreen() {
  const { someParam } = useParams(PATHS.MAIN.TAB_1.TAB_1_STACK_SCREEN);
  return (
    <View style={{ flex: 1 }}>
      <Text>Tab 1 Stack Screen ({someParam})</Text>
      <Button
        onPress={() => {
          goBack();
        }}
        title="Go Back"
      />
    </View>
  );
}

//Tab2.tsx
export default function Tab2() {
  return (
    <View style={{ flex: 1 }}>
      <Text>Tab 2</Text>
    </View>
  );
}
```