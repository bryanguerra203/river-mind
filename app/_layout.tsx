import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack, Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { colors } from "@/constants/colors";
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useSessionStore } from '@/store/sessionStore';
import { useGuestStore } from '@/store/guestStore';
import { supabase } from '@/lib/supabase';
import { View, ActivityIndicator, Text, StyleSheet, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { Session } from '@supabase/supabase-js';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';

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
  const { isGuestMode } = useGuestStore();
  const router = useRouter();
  const segments = useSegments();
  
  const [session, setSession] = useState<Session | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [splashHidden, setSplashHidden] = useState(false);
  const hasCheckedSession = useRef(false);

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

  // Handle session checking and routing
  useEffect(() => {
    if (!loaded) return;

    const checkSession = async () => {
      if (hasCheckedSession.current) return;
      
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log('Initial session check:', currentSession ? 'Active' : 'No session');
        
        setSession(currentSession);
        setInitialLoading(false);
        hasCheckedSession.current = true;

        // Only redirect if we're not already on the auth screen and not in guest mode
        const inAuthGroup = segments[0] === '(auth)';
        if (!currentSession && !inAuthGroup && !isGuestMode) {
          console.log('No session and not in guest mode, redirecting to login');
          router.replace('/(auth)/login');
        }
      } catch (e) {
        console.error("Error checking session:", e);
        setSession(null);
        setInitialLoading(false);
        hasCheckedSession.current = true;
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      //console.log('Auth state changed:', _event);
      setSession(newSession);
      
      // Only redirect if we're not already on the auth screen and not in guest mode
      const inAuthGroup = segments[0] === '(auth)';
      if (!newSession && !inAuthGroup && !isGuestMode) {
        console.log('Session ended and not in guest mode, redirecting to login');
        router.replace('/(auth)/login');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [loaded, segments, router, isGuestMode]);

  // Handle server sync
  useEffect(() => {
    const syncData = async () => {
      if (isOnline && session) {
        try {
          await syncWithServer();
        } catch (error: any) {
          if (error.message && (
            error.message.includes('403') || 
            error.message.includes('session_not_found') ||
            error.message.includes('user_not_found')
          )) {
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

  // Show main app if user is authenticated OR in guest mode
  const shouldShowMainApp = session || isGuestMode;

  return (
    <ThemeProvider value={DarkTheme}>
      <StatusBar style="light" />
      <Stack screenOptions={{ 
        headerShown: false, 
        headerTintColor: colors.text.primary,
        headerTitleStyle: { color: colors.text.primary },
        headerStyle: { backgroundColor: colors.background.primary },
      }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen 
          name="new-session" 
          options={{ 
            title: "Add Session",
            presentation: "modal",
            headerBackTitle: "Sessions",
            gestureEnabled: true,
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="session/[id]" 
          options={{ 
            headerShown: true,
            title: 'Session Details',
            headerBackTitle: 'Sessions',
          }} 
        />
        <Stack.Screen name="edit-session/[id]" />
        <Stack.Screen 
          name="new-bankroll-session" 
          options={{ 
            headerShown: true,
            title: 'New Poker Game',
            headerBackTitle: 'Bankroll',
            headerTintColor: colors.text.primary,
            headerTitleStyle: { color: colors.text.primary },
            headerStyle: { backgroundColor: colors.background.primary },
          }} 
        />
        <Stack.Screen 
          name="bankroll-session/[id]" 
          options={{ 
            headerShown: true,
            title: 'Poker Game',
            headerBackTitle: 'Bankroll',
            headerTintColor: colors.text.primary,
            headerTitleStyle: { color: colors.text.primary },
            headerStyle: { backgroundColor: colors.background.primary },
          }} 
        />
      </Stack>
    </ThemeProvider>
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