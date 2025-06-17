import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { useSessionStore } from '@/store/sessionStore';

const OTP_LENGTH = 6;

export default function VerifyScreen() {
  const params = useLocalSearchParams();
  const { email } = params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60); // Start with 60 seconds
  const syncWithServer = useSessionStore(state => state.syncWithServer);
  
  // Create refs for each input
  const inputRefs = useRef<TextInput[]>([]);

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, OTP_LENGTH);
  }, []);

  // Countdown timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [resendTimer]);

  const handleChangeText = (text: string, index: number) => {
    // Update the OTP array
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // If text is not empty and there is a next input, focus it
    if (text !== '' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // If backspace is pressed and current input is empty, focus previous input
    if (e.nativeEvent.key === 'Backspace' && index > 0 && otp[index] === '') {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== OTP_LENGTH) {
      Alert.alert('Error', 'Please enter the complete verification code');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email as string,
        token: otpString,
        type: 'email'
      });

      if (error) throw error;

      // After successful verification, sync sessions
      await syncWithServer();
      
      // Navigate to home screen
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Verification error:', error);
      Alert.alert('Verification Failed', error.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email as string,
      });

      if (error) throw error;

      Alert.alert('Success', 'A new verification code has been sent to your email');
      setResendTimer(60); // Reset timer to 60 seconds
    } catch (error: any) {
      console.error('Resend code error:', error);
      Alert.alert('Error', error.message || 'Failed to resend verification code');
    }
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
          <Text style={styles.title}>Verify Email</Text>
          
          <Text style={styles.description}>
            Please enter the verification code sent to {email}
          </Text>

          <View style={styles.otpContainer}>
            {Array(OTP_LENGTH).fill(0).map((_, index) => (
              <TextInput
                key={index}
                ref={ref => {
                  if (ref) {
                    inputRefs.current[index] = ref;
                  }
                }}
                style={styles.otpInput}
                value={otp[index]}
                onChangeText={(text) => handleChangeText(text.slice(-1), index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                selectionColor={colors.accent.primary}
              />
            ))}
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Verifying...' : 'Verify Email'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleResendCode}
            style={styles.resendLink}
            disabled={resendTimer > 0 || loading}
          >
            <Text style={[styles.resendText, resendTimer > 0 && styles.resendTextDisabled]}>
              {resendTimer > 0 
                ? `Resend code in ${resendTimer}s` 
                : "Didn't receive the code? "}
              {resendTimer === 0 && <Text style={styles.resendTextBold}>Resend</Text>}
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
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.background.secondary,
    color: colors.text.primary,
    fontSize: 24,
    textAlign: 'center',
    padding: 0,
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
  resendLink: {
    marginTop: 20,
  },
  resendText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  resendTextBold: {
    color: colors.accent.primary,
    fontWeight: '600',
  },
  resendTextDisabled: {
    color: colors.text.secondary,
    opacity: 0.7,
  },
});