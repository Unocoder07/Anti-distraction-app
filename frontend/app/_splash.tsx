// Splash Screen
import { COLORS } from '@/src/constants/colors';
import { SPACING } from '@/src/constants/spacing';
import { useAuthStore } from '@/src/store/authStore';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function SplashScreen() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);
  const loading = useAuthStore((state) => state.loading);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    // Wait for auth to initialize
    if (!initialized) {
      console.log('Splash: Waiting for auth to initialize...');
      return;
    }

    console.log('Splash: Auth initialized, user:', user ? 'logged in' : 'not logged in');

    // Small delay for splash screen effect
    const timer = setTimeout(() => {
      if (user) {
        // User is logged in, go to main app
        console.log('Splash: Redirecting to main app');
        router.replace('/(tabs)' as any);
      } else {
        // User is not logged in, go to login
        console.log('Splash: Redirecting to login');
        router.replace('/auth/login' as any);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [user, initialized]);

  return (
    <View style={styles.container}>
      {/* Animated Background Gradient */}
      <View style={styles.gradientBg} />

      {/* Logo Section */}
      <View style={styles.logoSection}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>🎯</Text>
        </View>
        <Text style={styles.appName}>Sankalai</Text>
        <Text style={styles.tagline}>Focus OS</Text>
      </View>

      {/* Loading Indicator */}
      <View style={styles.loadingSection}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>
          {loading ? 'Initializing Focus Protocol...' : 'Loading...'}
        </Text>
      </View>

      {/* Bottom Text */}
      <View style={styles.bottomSection}>
        <Text style={styles.versionText}>v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xxxl,
  },
  gradientBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.background,
    opacity: 0.5,
  },

  // Logo Section
  logoSection: {
    alignItems: 'center',
    gap: SPACING.lg,
    marginTop: SPACING.xxxl,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0 0 20px ${COLORS.primary}80`, // 0.5 opacity
    elevation: 10,
  },
  logoEmoji: {
    fontSize: 48,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // Loading Section
  loadingSection: {
    alignItems: 'center',
    gap: SPACING.lg,
  },
  loadingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    letterSpacing: 0.5,
  },

  // Bottom Section
  bottomSection: {
    alignItems: 'center',
  },
  versionText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
