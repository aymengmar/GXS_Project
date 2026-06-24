import "../global.css";

import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { useEffect } from "react";

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

  if (!fontsLoaded) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}
