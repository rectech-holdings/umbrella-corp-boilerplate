# RN Typed Router

This is a nested router solution meant as a replacement for react-navigation, with a focus on performance and type correctness.

First define your routes in a nested manner (typically in a `router.tsx` file or the like) to create your `Navigator` and navigation functions. Next, render your `Navigator` at the root of your app. Finally, use the navigation constants and functions exported from your route definition (e.g. the exports defined in `router.tsx`) to interact with the router.

If you wish to share route definitions between your frontend and backend, you will need to make use of an advanced pattern where you create your definition in two steps, first by calling `createNonUIRouteDefinition` and then by calling `extendNonUIRouteDefinition`.

Full basic demonstration included below:

```tsx
//router.tsx
import React, { ReactNode, Suspense } from "react";
import { Button, Text, View } from "react-native";

import { createRouter, createRouteDefinition, ParamTypes } from "rn-typed-router";
const routeDef = createRouteDefinition({
  type: "switch",
  initialRoute: "withoutParams",
  Wrapper: (a: { children: ReactNode }) => <Suspense fallback={null}>{a.children}</Suspense>,
  routes: {
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
                navigate(PATHS.bloop.baz.fizz, { baz: "qwer", fizz: "asdf", bloop: 234 });
              }}
              title="Navigate"
            />
          </View>
        );
      },
    },
    bloop: {
      type: "tab",
      params: {
        bloopParam: ParamTypes.number().default(1234),
      },
      routes: {
        baz: {
          type: "stack",
          params: {
            bazParam: ParamTypes.enum({ asdf: true, qwer: true }),
          },
          routes: {
            fizz: {
              type: "leaf",
              Component: React.lazy(() => import("./fizzPage.js")),
              params: {
                fizzParam: ParamTypes.string(),
              },
            },
          },
        },
      },
    },
    qwer: {
      type: "leaf",
      params: {
        qwerParam: ParamTypes.string().default("bloah"),
      },
      Component: () => {
        const { qwerParam } = useParams(PATHS.qwer);
        return (
          <View style={{ flex: 1 }}>
            <Text>This is the Qwer Page and the qwer parameter: {qwerParam}</Text>
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

//App.tsx
import { Navigator } from "./router.tsx";

export default function App() {
  return <Navigator />;
}

//fizzPage.tsx
import { PATHS, navigate, useParams } from "./router.tsx";
import { Button } from "react-native";

export default function FizzPage() {
  const { bloopParam, bazParam, fizzParam } = useParams(PATHS.bloop.baz.fizz);

  return (
    <Button
      title="Press Me"
      onPress={() => {
        console.log(bloopParam, bazParam, fizzParam);
        navigate(PATHS.bloop.baz.fizz, { baz: "qwer", fizz: "qwer", bloop: 599 });
      }}
    />
  );
}
```
