import { Suspense, useEffect, StrictMode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Navigator } from "./Router.js";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView, BorderlessButton } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle } from "react-native-reanimated";
import { createApiReactSDK } from "ac-api";

let Acme: Awaited<ReturnType<typeof createApiReactSDK>>;
const AcmeProm = createApiReactSDK().then((a) => {
  Acme = a;
});

import {
  createUseWhitelabelForm,
  createWhitelabelComponent,
  createWhitelabelComponentWithOptions,
} from "react-whitelabel-form";

type InputProps = React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;
type SelectProps = React.DetailedHTMLProps<React.SelectHTMLAttributes<HTMLSelectElement>, HTMLSelectElement>;

const useAcmeForm = createUseWhitelabelForm({
  Select: createWhitelabelComponentWithOptions<{ label: string } & SelectProps, { label: string; key: string }>((p) => {
    const { label, errors, onChangeValue, value, options, ...nativeProps } = p;
    return (
      <select
        {...nativeProps}
        value={p.options.find((o) => o.key === p.value)?.key}
        onChange={(e) => {
          p.onChangeValue(p.options.find((o) => o.key === e.target.value)?.value);
          nativeProps?.onChange?.(e);
        }}
      >
        {p.options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }),
  Input: createWhitelabelComponent<{ label: string }, string>((p) => {
    const { onChangeValue, errors, onBlur, onFocus, value } = p;

    return (
      <div>
        <input
          value={value}
          onBlur={onBlur}
          onFocus={onFocus}
          onChange={(e) => {
            onChangeValue(e.target.value);
          }}
        />
        {errors.length ? <div>{errors[0]}</div> : null}
      </div>
    );
  }),
});

function SomeForm() {
  const { Input, Select, store, useStoreValue } = useAcmeForm({
    initState: { text: "", selectVal: { complexVal: 123 } },
  });

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!store.validate()) {
          return;
        }

        const data = store.get();
        //Do something with the data...

        store.reset();
      }}
    >
      <Input required field={(s) => s.text} label="Cool Input" />
    </form>
  );
}

export default function App() {
  return (
    // <StrictMode>
    <Suspense>
      <AppInner />
    </Suspense>
    // </StrictMode>
  );
}

function AppInner() {
  if (!Acme) {
    throw AcmeProm;
  }

  return (
    <Acme.SDKProvider>
      <SafeAreaProvider style={{ flex: 1 }} testID="a">
        <GestureHandlerRootView style={{ flex: 1 }} testID="b">
          <Navigator />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </Acme.SDKProvider>
  );
}

function SomeComponent() {
  const { data } = Acme.useSDK().loans.getAllLoans({});

  return (
    <BorderlessButton
      onPress={() => {
        console.log("WADDUP!!!!");
      }}
    >
      <Text>GESTURE HANDLER BUTTOn</Text>
    </BorderlessButton>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
