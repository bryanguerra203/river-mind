import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';

const OTP_LENGTH = 6;

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'otp' | 'newPassword'>('email');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Create array of refs
  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Initialize refs array
  React.useEffect(() => {
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

  const handleSendResetEmail = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: undefined,
      });

      if (error) throw error;

      Alert.alert('Success', 'Password reset code has been sent to your email');
      setStep('otp');
      setResendTimer(60); // Start 60 second countdown
    } catch (error: any) {
      console.error('Reset password error:', error);
      if (error.message.includes('User not found')) {
        setError('No account found with this email address');
      } else if (error.message.includes('Invalid email')) {
        setError('Please enter a valid email address');
      } else if (error.message.includes('rate limit')) {
        setError('Too many attempts. Please try again later');
      } else {
        setError(error.message || 'Failed to send reset code');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter the complete verification code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpString,
        type: 'recovery'
      });

      if (error) throw error;

      setStep('newPassword');
    } catch (error: any) {
      console.error('OTP verification error:', error);
      if (error.message.includes('Invalid OTP')) {
        setError('Invalid verification code. Please try again');
      } else if (error.message.includes('expired')) {
        setError('Verification code has expired. Please request a new one');
      } else if (error.message.includes('rate limit')) {
        setError('Too many attempts. Please try again later');
      } else {
        setError(error.message || 'Failed to verify code');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      Alert.alert(
        'Success',
        'Your password has been updated successfully',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/login')
          }
        ]
      );
    } catch (error: any) {
      console.error('Password update error:', error);
      if (error.message.includes('Password should be at least')) {
        setError('Password must be at least 8 characters long');
      } else if (error.message.includes('rate limit')) {
        setError('Too many attempts. Please try again later');
      } else {
        setError(error.message || 'Failed to update password');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderEmailStep = () => (
    <>
      <Text style={styles.description}>
        Enter your email address and we'll send you a code to reset your password
      </Text>

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
          editable={!loading}
        />
      </View>

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSendResetEmail}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Sending...' : 'Send Reset Code'}
        </Text>
      </TouchableOpacity>
    </>
  );

  const renderOtpStep = () => (
    <>
      <Text style={styles.description}>
        Enter the verification code sent to {email}
      </Text>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.otpContainer}>
        {Array(OTP_LENGTH).fill(0).map((_, index) => (
          <TextInput
            key={index}
            ref={ref => {
              inputRefs.current[index] = ref;
            }}
            style={styles.otpInput}
            value={otp[index]}
            onChangeText={(text) => {
              const newOtp = [...otp];
              newOtp[index] = text.slice(-1);
              setOtp(newOtp);
              if (text && index < OTP_LENGTH - 1) {
                inputRefs.current[index + 1]?.focus();
              }
            }}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
                const newOtp = [...otp];
                newOtp[index - 1] = '';
                setOtp(newOtp);
                inputRefs.current[index - 1]?.focus();
              }
            }}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            editable={!loading}
          />
        ))}
      </View>

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleVerifyOtp}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Verifying...' : 'Verify Code'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={handleSendResetEmail}
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
    </>
  );

  const renderNewPasswordStep = () => (
    <>
      <Text style={styles.description}>
        Enter your new password
      </Text>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={20} color={colors.text.secondary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="New Password"
          placeholderTextColor={colors.text.secondary}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={!showPassword}
          editable={!loading}
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

      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={20} color={colors.text.secondary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Confirm New Password"
          placeholderTextColor={colors.text.secondary}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
          editable={!loading}
        />
        <TouchableOpacity 
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          style={styles.eyeIcon}
        >
          <Ionicons 
            name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
            size={20} 
            color={colors.text.secondary} 
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleUpdatePassword}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Updating...' : 'Update Password'}
        </Text>
      </TouchableOpacity>
    </>
  );

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
          <Text style={styles.title}>Reset Password</Text>

          {step === 'email' && renderEmailStep()}
          {step === 'otp' && renderOtpStep()}
          {step === 'newPassword' && renderNewPasswordStep()}

          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backLink}
          >
            <Text style={styles.backText}>
              Back to <Text style={styles.backTextBold}>Login</Text>
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
  backLink: {
    marginTop: 20,
  },
  backText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  backTextBold: {
    color: colors.accent.primary,
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
});