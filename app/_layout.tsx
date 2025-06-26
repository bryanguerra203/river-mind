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
import { ErrorBoundary } from '@/components/ErrorBoundary';

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
  const [storeInitialized, setStoreInitialized] = useState(false);
  const hasCheckedSession = useRef(false);

  // Safe access to store values
  const safeIsGuestMode = storeInitialized ? isGuestMode : false;
  const safeSyncWithServer = storeInitialized ? syncWithServer : (() => Promise.resolve());

  // Handle font loading errors
  useEffect(() => {
    if (error) {
      console.error("Font loading error:", error);
      // Don't throw the error, just log it and continue
    }
  }, [error]);

  // Handle splash screen hiding
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync().catch((e) => {
        console.warn("Error hiding splash screen:", e);
        // Ignore errors from hiding splash screen
      });
    }
  }, [loaded]);

  // Wait for stores to be initialized
  useEffect(() => {
    const timer = setTimeout(() => {
      setStoreInitialized(true);
    }, 100);
    
    // Add a fallback timeout to prevent infinite loading
    const fallbackTimer = setTimeout(() => {
      console.warn('Store initialization timeout, forcing initialization');
      setStoreInitialized(true);
      setInitialLoading(false);
    }, 10000); // 10 second timeout
    
    return () => {
      clearTimeout(timer);
      clearTimeout(fallbackTimer);
    };
  }, []);

  // Handle session checking and routing
  useEffect(() => {
    if (!loaded || !storeInitialized) return;

    const checkSession = async () => {
      if (hasCheckedSession.current) return;
      
      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          setSession(null);
          setInitialLoading(false);
          hasCheckedSession.current = true;
          return;
        }
        
        console.log('Initial session check:', currentSession ? 'Active' : 'No session');
        
        setSession(currentSession);
        setInitialLoading(false);
        hasCheckedSession.current = true;

        // Only redirect if we're not already on the auth screen and not in guest mode
        const inAuthGroup = segments[0] === '(auth)';
        if (!currentSession && !inAuthGroup && !safeIsGuestMode) {
          console.log('No session and not in guest mode, redirecting to login');
          try {
            await router.replace('/(auth)/login');
          } catch (routerError) {
            console.error('Error navigating to login:', routerError);
          }
        }
      } catch (e) {
        console.error("Error checking session:", e);
        setSession(null);
        setInitialLoading(false);
        hasCheckedSession.current = true;
      }
    };

    checkSession();

    let subscription: any = null;
    try {
      const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
        console.log('Auth state changed:', _event);
        setSession(newSession);
        
        // Only redirect if we're not already on the auth screen and not in guest mode
        const inAuthGroup = segments[0] === '(auth)';
        if (!newSession && !inAuthGroup && !safeIsGuestMode) {
          console.log('Session ended and not in guest mode, redirecting to login');
          try {
            router.replace('/(auth)/login');
          } catch (routerError) {
            console.error('Error navigating to login:', routerError);
          }
        }
      });
      subscription = authSubscription;
    } catch (error) {
      console.error('Error setting up auth state listener:', error);
    }

    return () => {
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing from auth state:', error);
        }
      }
    };
  }, [loaded, segments, router, safeIsGuestMode, storeInitialized]);

  // Handle server sync
  useEffect(() => {
    const syncData = async () => {
      if (isOnline && session && storeInitialized) {
        try {
          await safeSyncWithServer();
        } catch (error: any) {
          console.error("Error during server sync:", error);
          if (error.message && (
            error.message.includes('403') || 
            error.message.includes('session_not_found') ||
            error.message.includes('user_not_found')
          )) {
            console.warn("Session invalidated, signing out and redirecting to login.");
            try {
              await supabase.auth.signOut();
              try {
                await router.replace('/(auth)/login');
              } catch (routerError) {
                console.error('Error navigating to login after sign out:', routerError);
              }
            } catch (signOutError) {
              console.error("Error signing out after session invalidation:", signOutError);
            }
          }
        }
      }
    };
    
    // Add a small delay to prevent immediate sync on startup
    const timer = setTimeout(() => {
      syncData();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [isOnline, session, safeSyncWithServer, router, storeInitialized]);

  // Show loading screen only during initial load
  if (!loaded || initialLoading || !storeInitialized) {
    return (
      <ErrorBoundary>
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
      </ErrorBoundary>
    );
  }

  // Show main app if user is authenticated OR in guest mode
  const shouldShowMainApp = session || safeIsGuestMode;

  return (
    <ErrorBoundary>
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
          <Stack.Screen 
            name="edit-session/[id]" 
            options={{ 
              headerShown: true,
              title: 'Edit Session',
              headerBackTitle: 'Sessions',
              headerTintColor: colors.text.primary,
              headerTitleStyle: { color: colors.text.primary },
              headerStyle: { backgroundColor: colors.background.primary },
            }} 
          />
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
    </ErrorBoundary>
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