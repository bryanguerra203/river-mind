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
import { View, ActivityIndicator, Text, StyleSheet, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { Session } from '@supabase/supabase-js';

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
  const router = useRouter();
  
  const [session, setSession] = useState<Session | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [splashHidden, setSplashHidden] = useState(false);

  // Handle font loading errors
  useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  // Handle splash screen hiding
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync().catch(() => {
        // Ignore errors from hiding splash screen
      });
    }
  }, [loaded]);

  // Handle session checking
  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(currentSession);
          setInitialLoading(false);
        }
      } catch (e) {
        console.error("Error getting session on startup:", e);
        if (mounted) {
          setInitialLoading(false);
        }
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) {
        setSession(newSession);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Handle server sync
  useEffect(() => {
    const syncData = async () => {
      if (isOnline && session) {
        try {
          await syncWithServer();
        } catch (error: any) {
          // Check for 403 or session_not_found error from Supabase
          if (error.message && (error.message.includes('403') || error.message.includes('session_not_found'))) {
            console.warn("Session invalidated, signing out and redirecting to login.");
            try {
              await supabase.auth.signOut();
              router.replace('/(auth)/login');
            } catch (signOutError) {
              console.error("Error signing out after session invalidation:", signOutError);
            }
          } else {
            console.error("Error during server sync:", error);
          }
        }
      }
    };
    syncData();
  }, [isOnline, session, syncWithServer, router]);

  // Show loading screen only during initial load
  if (!loaded || initialLoading) {
    return (
      <Modal
        visible={true}
        transparent={true}
        animationType="fade"
      >
        <BlurView intensity={20} style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={colors.accent.primary} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </BlurView>
      </Modal>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      {session ? (
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
      ) : (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
        </Stack>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  loadingContent: {
    backgroundColor: colors.background.secondary,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  loadingText: {
    color: colors.text.primary,
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
});