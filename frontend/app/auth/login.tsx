// Login Screen
import { RADIUS, SPACING } from '@/src/constants/spacing';
import { authService } from '@/src/services/authService';
import { useAuthStore } from '@/src/store/authStore';
import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useTheme } from '@/src/theme';
import type { ThemeColors } from '@/src/theme';
import { router } from 'expo-router';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
const googleAuthConfigured = Boolean(GOOGLE_WEB_CLIENT_ID.trim());

// Native Google Sign-In uses the Play Services account picker (no browser),
// and mints an idToken for the Web client ID that the backend verifies.
if (googleAuthConfigured) {
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID.trim(),
    iosClientId: GOOGLE_IOS_CLIENT_ID.trim() || undefined,
  });
}

function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <Path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <Path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.1 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.5 16.2 44 24 44z"
      />
      <Path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C36.9 39.3 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </Svg>
  );
}

export default function LoginScreen() {
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const setSession = useAuthStore((state) => state.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const isSubmitting = loading || googleLoading;

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      newErrors.email = 'Invalid email format';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (googleLoading || !validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const authResponse = await authService.signIn(email.trim().toLowerCase(), password);
      await setSession(authResponse);
      router.replace('/(tabs)' as any);
    } catch (error: any) {
      console.error('Login error:', error);
      setErrors({ general: error.message });
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/auth/forgot-password' as any);
  };

  const handleGoogleLogin = async () => {
    if (loading || googleLoading) return;

    if (!googleAuthConfigured) {
      const message = 'Google Sign-In needs EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID set to your Web OAuth client ID.';
      setErrors({ general: message });
      Alert.alert('Google Sign-In Unavailable', message);
      return;
    }

    setGoogleLoading(true);
    setErrors({});

    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();

      if (isCancelledResponse(response)) {
        return;
      }

      let idToken = response.data.idToken;

      if (!idToken) {
        const tokens = await GoogleSignin.getTokens();
        idToken = tokens.idToken;
      }

      if (!idToken) {
        setErrors({
          general: 'Google Sign-In did not return an ID token. Check that the Web OAuth client ID is configured.',
        });
        return;
      }

      const authResponse = await authService.signInWithGoogle(idToken);
      await setSession(authResponse);
      router.replace('/(tabs)' as any);
    } catch (error: any) {
      if (isErrorWithCode(error)) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
          return;
        }
        if (error.code === statusCodes.IN_PROGRESS) {
          setErrors({ general: 'Google Sign-In is already in progress.' });
          return;
        }
      }

      const message = error?.message || 'Google Sign-In failed. Please try again.';
      console.error('Google sign-in error:', error);
      setErrors({ general: message });
      Alert.alert('Google Sign-In Failed', message);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🎯</Text>
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue your focus journey</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View
              style={[
                styles.inputWrapper,
                errors.email && styles.inputWrapperError,
              ]}
            >
              <Mail size={18} color={COLORS.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={COLORS.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isSubmitting}
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View
              style={[
                styles.inputWrapper,
                errors.password && styles.inputWrapperError,
              ]}
            >
              <Lock size={18} color={COLORS.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!isSubmitting}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={8}
                disabled={isSubmitting}
              >
                {showPassword ? (
                  <Eye size={18} color={COLORS.textSecondary} />
                ) : (
                  <EyeOff size={18} color={COLORS.textSecondary} />
                )}
              </Pressable>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          {/* Forgot Password */}
          <Pressable style={styles.forgotPasswordBtn} onPress={handleForgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </Pressable>

          {/* General Error */}
          {errors.general && (
            <View style={styles.generalError}>
              <Text style={styles.errorText}>{errors.general}</Text>
            </View>
          )}

          {/* Login Button */}
          <Pressable
            style={({ pressed }: { pressed: boolean }) => [
              styles.loginBtn,
              (pressed || loading) && styles.loginBtnPressed,
            ]}
            onPress={handleLogin}
            disabled={isSubmitting}
          >
            <Text style={styles.loginBtnText}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Text>
          </Pressable>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign-In */}
          <Pressable
            style={({ pressed }: { pressed: boolean }) => [
              styles.googleBtn,
              (pressed || googleLoading) && styles.googleBtnPressed,
            ]}
            onPress={handleGoogleLogin}
            disabled={isSubmitting}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color={COLORS.text} />
            ) : (
              <GoogleIcon />
            )}
            <Text style={styles.googleBtnText}>
              {googleLoading ? 'Connecting...' : 'Continue with Google'}
            </Text>
          </Pressable>
        </View>

        {/* Sign Up Link */}
        <View style={styles.signupSection}>
          <Text style={styles.signupText}>Don&apos;t have an account? </Text>
          <Pressable onPress={() => router.push('/auth/signup' as any)}>
            <Text style={styles.signupLink}>Sign Up</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    justifyContent: 'space-between',
  },

  // Header
  header: {
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.xxxl,
    marginTop: SPACING.xl,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0 0 16px ${COLORS.primary}66`, // 0.4 opacity
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // Form
  form: {
    gap: SPACING.lg,
  },
  inputGroup: {
    gap: SPACING.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  inputWrapperError: {
    borderColor: COLORS.danger,
    backgroundColor: 'rgba(239,68,68,0.05)',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 11,
    color: COLORS.danger,
    fontWeight: '500',
  },
  generalError: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },

  // Forgot Password
  forgotPasswordBtn: {
    alignSelf: 'flex-end',
    paddingVertical: SPACING.sm,
  },
  forgotPasswordText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Login Button
  loginBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
    boxShadow: `0 0 16px ${COLORS.primary}5A`, // 0.35 opacity
    elevation: 6,
  },
  loginBtnPressed: {
    opacity: 0.85,
  },
  loginBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.background,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // Google Sign-In
  googleBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    width: '100%',
  },
  googleBtnPressed: {
    opacity: 0.78,
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },

  // Signup Section
  signupSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  signupText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  signupLink: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
  },
});
