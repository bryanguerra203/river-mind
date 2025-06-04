import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { colors } from "@/constants/colors";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) {
      console.error(error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background.primary,
          },
          headerTintColor: colors.text.primary,
          headerTitleStyle: {
            fontWeight: '600',
          },
          contentStyle: {
            backgroundColor: colors.background.primary,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="new-session" 
          options={{ 
            title: "Add Session",
            presentation: "modal",
          }} 
        />
        <Stack.Screen 
          name="session/[id]" 
          options={{ 
            title: "Session Details",
          }} 
        />
        <Stack.Screen 
          name="edit-session/[id]" 
          options={{ 
            title: "Edit Session",
            presentation: "modal",
          }} 
        />
        <Stack.Screen 
          name="new-bankroll-session" 
          options={{ 
            title: "New Poker Session",
            presentation: "modal",
          }} 
        />
        <Stack.Screen 
          name="bankroll-session/[id]" 
          options={{ 
            title: "Poker Session",
          }} 
        />
      </Stack>
    </>
  );
}