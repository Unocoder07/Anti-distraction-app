import { router, Slot, usePathname, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { BarChart2, Home, ShieldAlert, Timer } from 'lucide-react-native';
import { useEffect, useMemo } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore, useThemeStore } from '@/src/store';
import { safeModeManager } from '@/src/services/safeModeManager';
import { useTheme, useThemeMode } from '@/src/theme';
import type { ThemeColors } from '@/src/theme';

export default function RootLayout() {
  const initTheme = useThemeStore((s) => s.initTheme);

  // Restore the saved theme before the first paint of the app shell.
  useEffect(() => {
    void initTheme();
  }, [initTheme]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LayoutContent />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function LayoutContent() {
  const pathname = usePathname();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { user, initialized } = useAuthStore();
  const COLORS = useTheme();
  const mode = useThemeMode();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);

  const inAuthGroup = segments[0] === 'auth';
  const isSplash = pathname === '/_splash';

  useEffect(() => {
    if (!initialized || isSplash) return;

    const unauthenticatedAuthRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password'];
    const onboardingAuthRoutes = ['/auth/exam-selection', '/auth/subject-selection'];
    const isUnauthenticatedAuthRoute = unauthenticatedAuthRoutes.some((route) => pathname.startsWith(route));
    const isOnboardingAuthRoute = onboardingAuthRoutes.some((route) => pathname.startsWith(route));

    if (!user && !inAuthGroup) {
      router.replace('/auth/login' as any);
      return;
    }

    if (!user && isOnboardingAuthRoute) {
      router.replace('/auth/login' as any);
      return;
    }

    if (user && isUnauthenticatedAuthRoute) {
      router.replace('/(tabs)' as any);
    }
  }, [user, initialized, inAuthGroup, isSplash, pathname]);

  const hideNav = pathname === '/focus' || pathname === '/(tabs)/focus' || isSplash || inAuthGroup;

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    void safeModeManager.refreshSensitiveAppsWhitelist();
  }, []);

  return (
    <View style={styles.outerContainer}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />

      {/* Device frame — only on web */}
      <View style={styles.deviceFrame}>

        {/* Dynamic Island notch */}
        <View style={[styles.notchWrapper, { pointerEvents: 'none' }]}>
          <View style={styles.notch} />
        </View>

        {/* Page content */}
        <View style={[styles.contentArea, !hideNav && { paddingBottom: 80 }]}>
          <Slot />
        </View>

        {/* Bottom Navigation */}
        {!hideNav && (
          <View style={[styles.bottomNav, { paddingBottom: insets.bottom || 8 }]}>
            <NavItem
              label="Hub"
              icon={<Home size={22} color="#fff" />}
              route="/"
              pathname={pathname}
            />
            <NavItem
              label="Data"
              icon={<BarChart2 size={22} color="#fff" />}
              route="/analytics"
              pathname={pathname}
            />

            {/* Center Focus Button */}
            <View style={styles.focusButtonWrapper}>
              <Pressable
                style={({ pressed }: { pressed: boolean }) => [styles.focusButton, pressed && { opacity: 0.85 }]}
                onPress={() => router.push('/focus' as any)}
              >
                <Timer size={28} color={COLORS.onPrimary} />
              </Pressable>
            </View>

            <NavItem
              label="Shield"
              icon={<ShieldAlert size={22} color="#fff" />}
              route="/blocked"
              pathname={pathname}
            />
            <NavItem
              label="Me"
              icon={
                <View style={styles.avatarWrapper}>
                  <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80' }}
                    style={styles.avatar}
                  />
                </View>
              }
              route="/profile"
              pathname={pathname}
            />
          </View>
        )}
      </View>
    </View>
  );
}

// ─── NavItem ────────────────────────────────────────────────────────────────

function NavItem({
  route,
  icon,
  label,
  pathname,
}: {
  route: string;
  icon: React.ReactNode;
  label: string;
  pathname: string;
}) {
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const isActive =
    route === '/'
      ? pathname === '/' || pathname === '/index'
      : pathname.startsWith(route);

  const color = isActive ? COLORS.primary : COLORS.textSecondary;

  return (
    <Pressable
      style={styles.navItem}
      onPress={() => router.push(route as any)}
    >
      <View style={{ opacity: isActive ? 1 : 0.6 }}>
        {cloneWithColor(icon, color)}
      </View>
      <Text style={[styles.navLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

function cloneWithColor(icon: React.ReactNode, color: string): React.ReactNode {
  if (!icon || typeof icon !== 'object') return icon;
  const el = icon as React.ReactElement<{ color?: string }>;
  return { ...el, props: { ...el.props, color } };
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' && { padding: 32 }),
  },
  deviceFrame: {
    width: '100%',
    maxWidth: 400,
    flex: 1,
    backgroundColor: COLORS.background,
    overflow: 'hidden',
    position: 'relative',
    ...(Platform.OS === 'web' && {
      borderRadius: 40,
      borderWidth: 6,
      borderColor: COLORS.surface,
      boxShadow: '0 0 50px #000000CC', // 0.8 opacity = CC in hex
    }),
  },
  notchWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 28,
    alignItems: 'center',
    zIndex: 50,
  },
  notch: {
    width: '33%',
    height: 24,
    backgroundColor: '#000',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  contentArea: {
    flex: 1,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    zIndex: 40,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 8,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  focusButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  focusButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    boxShadow: '0 0 20px #2dd4bf99', // 0.6 opacity
    elevation: 10,
  },
  avatarWrapper: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.primary,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
});
