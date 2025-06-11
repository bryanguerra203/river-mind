import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack, Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { colors } from "@/constants/colors";
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useSessionStore } from '@/store/sessionStore';
import { supabase } from '@/lib/supabase';

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  const isOnline = useNetworkStatus();
  const { syncWithServer } = useSessionStore();
  const segments = useSegments();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // If we're not in the auth group and there's no session, redirect to login
        if (!segments[0]?.includes('(auth)') && !session) {
          router.replace('/login');
        }
        // If we're in the auth group and there is a session, redirect to home
        else if (segments[0]?.includes('(auth)') && session) {
          router.replace('/(tabs)');
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/login');
      } else if (event === 'SIGNED_IN') {
        router.replace('/(tabs)');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [segments]);

  useEffect(() => {
    if (isOnline) {
      syncWithServer();
    }
  }, [isOnline]);

  if (isLoading) {
    return null; // Or a loading spinner if you prefer
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
            headerBackTitle: "Sessions",
          }} 
        />
        <Stack.Screen 
          name="session/[id]" 
          options={{ 
            title: "Session Details",
            headerBackTitle: "Sessions",
          }} 
        />
        <Stack.Screen 
          name="edit-session/[id]" 
          options={{ 
            title: "Edit Session",
            presentation: "modal",
            headerBackTitle: "Sessions",
          }} 
        />
        <Stack.Screen 
          name="new-bankroll-session" 
          options={{ 
            title: "New Poker Session",
            presentation: "modal",
            headerBackTitle: "Bankroll",
          }} 
        />
        <Stack.Screen 
          name="bankroll-session/[id]" 
          options={{ 
            title: "Poker Session",
            headerBackTitle: "Bankroll",
          }} 
        />
      </Stack>
    </>
  );
}