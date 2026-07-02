import "../global.css";

import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import { LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// expo-router's useLinking fires a setTimeout that can race with the navigator
// mounting in React 19 concurrent mode — this is a known expo-router dev warning,
// not a bug in app code.
LogBox.ignoreLogs([
  "Can't perform a React state update on a component that hasn't mounted yet",
]);

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular: require("@/assets/fonts/Poppins_400Regular.ttf"),
    Poppins_500Medium: require("@/assets/fonts/Poppins_500Medium.ttf"),
    Poppins_600SemiBold: require("@/assets/fonts/Poppins_600SemiBold.ttf"),
    Poppins_700Bold: require("@/assets/fonts/Poppins_700Bold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
