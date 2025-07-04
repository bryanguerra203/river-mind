import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router, Stack, useNavigation } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { useSessionStore } from '@/store/sessionStore';
import { useGuestStore } from '@/store/guestStore';

export const options = { headerShown: false };

export default function LoginScreen() {
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { syncWithServer, clearStore } = useSessionStore();
  const { setGuestMode } = useGuestStore();
  const [hasClearedSession, setHasClearedSession] = useState(false);

  // Only clear session if there is an active session, and only once
  useEffect(() => {
    const clearSession = async () => {
      if (hasClearedSession) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.auth.signOut();
        await clearStore();
      }
      setHasClearedSession(true);
    };
    clearSession();
  }, [clearStore, hasClearedSession]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Clear guest mode when user logs in
      setGuestMode(false);

      // After successful login, sync sessions
      await syncWithServer();
      
      // Navigate to home screen
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific error cases with user-friendly messages
      if (error.status === 400 || error.message?.includes('400')) {
        setError('Invalid email or password');
      } else if (error.message?.includes('Email not confirmed')) {
        setError('Please verify your email address first');
      } else if (error.message?.includes('rate limit')) {
        setError('Too many attempts. Please try again later');
      } else if (error.message?.includes('network')) {
        setError('Network error. Please check your connection');
      } else {
        setError('An error occurred during login. Please try again');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    setGuestMode(true);
    router.replace('/(tabs)');
  };

  const handleForgotPassword = () => {
    router.push('/forgot-password');
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          <Image 
            source={require('../../assets/images/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>RiverMind</Text>
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={colors.text.secondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.text.secondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.text.secondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.text.secondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons 
                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                size={20} 
                color={colors.text.secondary} 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            onPress={handleForgotPassword}
            style={styles.forgotPasswordLink}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push('/signup')}
            style={styles.signupLink}
          >
            <Text style={styles.signupText}>
              Don't have an account? <Text style={styles.signupTextBold}>Sign up</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleContinueAsGuest}
            style={styles.guestLink}
          >
            <Text style={styles.guestText}>
              <Text style={styles.guestTextBold}>Continue as Guest</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    backgroundColor: colors.background.secondary,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: colors.text.primary,
  },
  eyeIcon: {
    padding: 8,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: colors.accent.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  signupLink: {
    marginTop: 20,
  },
  signupText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  signupTextBold: {
    color: colors.accent.primary,
    fontWeight: '600',
  },
  forgotPasswordLink: {
    marginTop: -8,
    marginBottom: 16,
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    color: colors.accent.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    width: '100%',
    padding: 10,
    backgroundColor: colors.accent.danger,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: colors.text.primary,
    textAlign: 'center',
  },
  guestLink: {
    marginTop: 16,
  },
  guestText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  guestTextBold: {
    color: colors.accent.primary,
    fontWeight: '600',
  },
}); 