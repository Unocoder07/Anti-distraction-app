import { ActiveSessionCard } from '@/src/components/blocked/ActiveSessionCard';
import type { BlockedApp } from '@/src/components/blocked/BlockedAppCard';
import { BlockedAppCard } from '@/src/components/blocked/BlockedAppCard';
import { BlockingSessionDialog } from '@/src/components/blocked/BlockingSessionDialog';
import { NativeBlockingSetup } from '@/src/components/blocked/NativeBlockingSetup';
import { UnlockDialog } from '@/src/components/blocked/UnlockDialog';
import { COLORS } from '@/src/constants/colors';
import { RADIUS, SPACING } from '@/src/constants/spacing';
import { DEFAULT_SESSION_DURATION } from '@/src/services/blockingService';
import {
  categorizeApps,
  getRecommendedBlockingApps,
  packageNameToId,
  SHIELD_CATEGORIES,
} from '@/src/services/installedAppsService';
import { nativeBlockingService } from '@/src/services/nativeBlockingService';
import { useAuthStore, useBlockingStore } from '@/src/store';
import { Info, RefreshCw, Shield, Smartphone } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function BlockedAppsScreen() {
  const { user } = useAuthStore();
  const {
    apps,
    activeSessions,
    loadBlockedApps,
    loadLocalBlockedApps,
    toggleApp,
    toggleLocalApp,
    startSession,
    breakSession,
    completeSession,
    cleanupStaleSessions,
    saveUserBlockedApps,
    saveLocalBlockedApps,
    setApps,
  } = useBlockingStore();

  const [unlockTarget, setUnlockTarget] = useState<BlockedApp | null>(null);
  const [sessionTarget, setSessionTarget] = useState<BlockedApp | null>(null);
  const [sessionDuration] = useState(DEFAULT_SESSION_DURATION);
  const [scanning, setScanning] = useState(false);
  const [detectedCount, setDetectedCount] = useState(0);
  const [permissionsReady, setPermissionsReady] = useState(false);
  const [startingSession, setStartingSession] = useState(false);

  const mergeWithSavedStatus = useCallback(
    (detected: BlockedApp[], saved: BlockedApp[]): BlockedApp[] => {
      const savedByPackage = new Map(saved.map((a) => [a.packageName, a]));
      return detected.map((app) => {
        const existing = savedByPackage.get(app.packageName);
        return existing ? { ...app, blocked: existing.blocked, id: existing.id } : app;
      });
    },
    []
  );

  const scanDeviceApps = useCallback(async () => {
    setScanning(true);
    try {
      const installed = await getRecommendedBlockingApps();
      setDetectedCount(installed.length);

      const detectedApps: BlockedApp[] = installed.map((app) => ({
        id: packageNameToId(app.packageName),
        name: app.name,
        category: app.category,
        icon: app.icon || '📱',
        blocked: false,
        packageName: app.packageName,
        bundleId: app.bundleId,
      }));

      if (detectedApps.length === 0) {
        setApps([]);
        if (user) {
          await saveUserBlockedApps(user.userId, []);
        } else {
          await saveLocalBlockedApps([]);
        }
        return;
      }

      if (user) {
        if (apps.length === 0) {
          await loadBlockedApps(user.userId);
        }
        const savedApps = useBlockingStore.getState().apps;
        const merged = mergeWithSavedStatus(detectedApps, savedApps);
        await saveUserBlockedApps(user.userId, merged);
        await loadBlockedApps(user.userId);
      } else {
        await loadLocalBlockedApps();
        const savedApps = useBlockingStore.getState().apps;
        const merged = mergeWithSavedStatus(detectedApps, savedApps);
        await saveLocalBlockedApps(merged);
      }
    } catch (error) {
      console.error('Error scanning device apps:', error);
      Alert.alert('Scan Failed', 'Could not scan installed apps. Please try again.');
    } finally {
      setScanning(false);
    }
  }, [apps, user, mergeWithSavedStatus, loadBlockedApps, loadLocalBlockedApps, saveUserBlockedApps, saveLocalBlockedApps, setApps]);

  useEffect(() => {
    scanDeviceApps();
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    if (Platform.OS !== 'android') return;
    const perms = await nativeBlockingService.checkPermissions();
    setPermissionsReady(perms.overlay && perms.accessibility && perms.usageStats);
  };

  const handleToggleApp = async (id: number) => {
    const app = apps.find((a) => a.id === id);
    if (!app) return;

    if (!app.blocked) {
      Alert.alert(
        'Block this app?',
        `Add ${app.name} to your Shield list?\n\nDuring a session, this app will be physically locked — you won't be able to open it even by switching apps.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Block',
            style: 'destructive',
            onPress: async () => {
              if (user) {
                await toggleApp(user.userId, id);
              } else {
                await toggleLocalApp(id);
              }
            },
          },
        ]
      );
      return;
    }

    if (user) {
      await toggleApp(user.userId, id);
    } else {
      await toggleLocalApp(id);
    }
  };

  const getBlockedAppsForSession = () =>
    displayApps
      .filter((a) => a.blocked && a.packageName)
      .map((a) => ({ packageName: a.packageName!, appName: a.name }));

  const handleStartShieldSession = async (triggerApp?: BlockedApp) => {
    const blockedApps = displayApps.filter((a) => a.blocked);
    if (blockedApps.length === 0) {
      Alert.alert('No Apps Selected', 'Toggle at least one app to BLOCKED before starting a Shield session.');
      return;
    }

    if (Platform.OS === 'android') {
      const hasPermissions = await nativeBlockingService.requestPermissions();
      await checkPermissions();
      if (!hasPermissions) {
        Alert.alert(
          'Permissions Required',
          'Shield needs Accessibility, Overlay, and Usage Access permissions to physically block apps on your device.'
        );
        return;
      }
    }

    const sessionApp = triggerApp ?? blockedApps[0];
    setStartingSession(true);
    setSessionTarget(null);

    try {
      if (user) {
        await startSession(user.userId, sessionApp.id, sessionApp.name, sessionDuration);
        await loadBlockedApps(user.userId);
      } else {
        Alert.alert(
          'Sign In Required',
          'Please sign in to start a Shield session and earn Focus Coins.'
        );
        return;
      }

      const blockedNames = blockedApps.map((a) => a.name).join(', ');
      Alert.alert(
        'Shield Active',
        `Physical blocking is ON for ${sessionDuration} minutes.\n\nLocked apps:\n${blockedNames}\n\nIf you try to open any of these apps, you will be sent back immediately.`,
        [{ text: 'Stay Focused' }]
      );
    } catch (error: any) {
      Alert.alert('Session Failed', error?.message ?? 'Could not start Shield session.');
    } finally {
      setStartingSession(false);
    }
  };

  const handleUnlockAttempt = (app: BlockedApp) => {
    if (activeSessions.has(app.id) && user) {
      setUnlockTarget(app);
    }
  };

  const handleConfirmUnlock = async (app: BlockedApp) => {
    const session = activeSessions.get(app.id);
    if (!session || !user) return;

    try {
      const fpLost = await breakSession(session.id, user.userId, app.id);
      setUnlockTarget(null);
      await loadBlockedApps(user.userId);
      Alert.alert('Session Broken', `You lost ${fpLost} Focus Points. Stay strong next time!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to break session. Please try again.');
    }
  };

  const handleSessionComplete = async (sessionId: string) => {
    if (!user) return;
    const session = activeSessionsArray.find((s) => s.id === sessionId);
    if (!session) return;

    try {
      const fpEarned = await completeSession(sessionId, user.userId, session.appId);
      await loadBlockedApps(user.userId);
      Alert.alert('Session Complete!', `You earned ${fpEarned} Focus Points. Great discipline!`);
    } catch (error) {
      console.error('Error completing session:', error);
    }
  };

  const handleCleanupSessions = () => {
    if (!user) return;
    Alert.alert('Clean Up Sessions?', 'Remove all active sessions without penalty?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clean Up',
        style: 'destructive',
        onPress: async () => {
          const count = await cleanupStaleSessions(user.userId);
          await loadBlockedApps(user.userId);
          Alert.alert('Done', `Removed ${count} session(s)`);
        },
      },
    ]);
  };

  const displayApps = apps;
  const blockedCount = displayApps.filter((a) => a.blocked).length;
  const activeSessionsArray = Array.from(activeSessions.values());
  const hasActiveSession = activeSessionsArray.length > 0;
  const grouped = categorizeApps(
    displayApps.map((a) => ({
      id: a.packageName ?? String(a.id),
      name: a.name,
      packageName: a.packageName ?? '',
      bundleId: a.bundleId ?? '',
      icon: a.icon,
      category: a.category,
      isSystemApp: false,
    }))
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Shield</Text>
          <Text style={styles.subtitle}>Block social, video & gaming apps during focus</Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable style={styles.refreshBtn} onPress={scanDeviceApps} disabled={scanning}>
            {scanning ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <RefreshCw size={16} color={COLORS.primary} />
            )}
          </Pressable>
          {blockedCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{blockedCount} locked</Text>
            </View>
          )}
        </View>
      </View>

      {/* Native permissions setup */}
      {Platform.OS === 'android' && !permissionsReady && (
        <NativeBlockingSetup onSetupComplete={checkPermissions} />
      )}

      {/* Activate Shield CTA */}
      {blockedCount > 0 && !hasActiveSession && (
        <Pressable
          style={[styles.shieldCta, startingSession && styles.shieldCtaDisabled]}
          onPress={() => setSessionTarget(displayApps.find((a) => a.blocked) ?? null)}
          disabled={startingSession}
        >
          <Shield size={20} color="#fff" />
          <View style={styles.shieldCtaText}>
            <Text style={styles.shieldCtaTitle}>Activate Shield</Text>
            <Text style={styles.shieldCtaSub}>
              Lock {blockedCount} app{blockedCount > 1 ? 's' : ''} for {sessionDuration} min
            </Text>
          </View>
        </Pressable>
      )}

      {/* Info card */}
      <View style={styles.infoCard}>
        <View style={styles.infoIconBox}>
          {scanning ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Info size={16} color={COLORS.primary} />
          )}
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>
            {scanning
              ? 'Scanning your phone...'
              : detectedCount > 0
                ? `${detectedCount} apps found on your device`
                : 'No distracting apps detected'}
          </Text>
          <Text style={styles.infoText}>
            {scanning
              ? 'Looking for installed social media and gaming apps...'
              : detectedCount > 0
                ? 'Only apps installed on YOUR phone are shown.\n\n' +
                  '1. Toggle apps to BLOCKED\n' +
                  '2. Tap Activate Shield\n' +
                  '3. Blocked apps are physically locked — switching apps won\'t help\n\n' +
                  'Calls and messages still work.'
                : Platform.OS === 'android'
                  ? 'No social media or gaming apps found on this device.\n\n' +
                    'If you have them installed, rebuild the app:\n' +
                    'npx expo run:android'
                  : 'App blocking is available on Android only.'}
          </Text>
        </View>
      </View>

      {/* Active sessions */}
      {hasActiveSession && (
        <View style={styles.sessionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shield Active</Text>
            <View style={styles.sessionHeaderRight}>
              <View style={styles.sessionCountBadge}>
                <Text style={styles.sessionCountText}>{activeSessionsArray.length}</Text>
              </View>
              <Text style={styles.cleanupButton} onPress={handleCleanupSessions}>
                Clean
              </Text>
            </View>
          </View>
          <View style={styles.sessionsList}>
            {activeSessionsArray.map((session, index) => {
              const app = displayApps.find((a) => a.id === session.appId);
              return (
                <ActiveSessionCard
                  key={`${session.id}-${session.appId}-${index}`}
                  session={session}
                  appName={app?.name || session.appName}
                  onSessionComplete={handleSessionComplete}
                />
              );
            })}
          </View>
          <View style={styles.activeShieldBanner}>
            <Smartphone size={14} color={COLORS.primary} />
            <Text style={styles.activeShieldText}>
              {getBlockedAppsForSession().length} apps physically locked on your device
            </Text>
          </View>
        </View>
      )}

      {/* App list by category */}
      {displayApps.length > 0 ? (
        SHIELD_CATEGORIES.map((category) => {
          const categoryApps = grouped[category];
          if (categoryApps.length === 0) return null;

          return (
            <View key={category}>
              <View style={styles.listHeader}>
                <Text style={styles.listTitle}>{category}</Text>
                <Text style={styles.listSub}>
                  {categoryApps.length} installed
                </Text>
              </View>
              <View style={styles.appList}>
                {categoryApps.map((installed) => {
                  const app = displayApps.find((a) => a.packageName === installed.packageName)!;
                  const appHasSession = activeSessions.has(app.id);
                  return (
                    <BlockedAppCard
                      key={app.packageName}
                      app={app}
                      onToggle={(id) => {
                        if (appHasSession) {
                          setUnlockTarget(app);
                        } else if (app.blocked && !hasActiveSession) {
                          setSessionTarget(app);
                        } else {
                          handleToggleApp(id);
                        }
                      }}
                      focusActive={appHasSession || hasActiveSession}
                      onUnlockAttempt={handleUnlockAttempt}
                    />
                  );
                })}
              </View>
            </View>
          );
        })
      ) : !scanning ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎯</Text>
          <Text style={styles.emptyTitle}>No Apps to Block</Text>
          <Text style={styles.emptyText}>
            We only show social media and gaming apps that are actually installed on your phone.
            None were found.
          </Text>
          <Pressable style={styles.rescanBtn} onPress={scanDeviceApps}>
            <RefreshCw size={14} color={COLORS.primary} />
            <Text style={styles.rescanText}>Rescan Device</Text>
          </Pressable>
        </View>
      ) : null}

      <BlockingSessionDialog
        visible={!!sessionTarget}
        app={sessionTarget}
        blockedCount={blockedCount}
        duration={sessionDuration}
        onStartSession={(_, duration) => handleStartShieldSession(sessionTarget ?? undefined)}
        onDismiss={() => setSessionTarget(null)}
      />

      <UnlockDialog
        visible={!!unlockTarget}
        app={unlockTarget}
        onReturnToFocus={() => setUnlockTarget(null)}
        onConfirmUnlock={handleConfirmUnlock}
        onDismiss={() => setUnlockTarget(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  container: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  refreshBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  countBadge: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  countText: { fontSize: 11, fontWeight: '700', color: '#f87171' },

  shieldCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
  },
  shieldCtaDisabled: { opacity: 0.6 },
  shieldCtaText: { flex: 1 },
  shieldCtaTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  shieldCtaSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  infoCard: {
    flexDirection: 'row',
    gap: SPACING.md,
    backgroundColor: `${COLORS.primary}10`,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  infoIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${COLORS.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: { flex: 1, gap: 4 },
  infoTitle: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  infoText: { fontSize: 11, color: COLORS.textSecondary, lineHeight: 16 },

  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  listTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  listSub: { fontSize: 11, color: COLORS.textSecondary },

  appList: { gap: 10, marginTop: 8 },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    gap: 12,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  emptyText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  rescanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${COLORS.primary}40`,
  },
  rescanText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },

  sessionsSection: { gap: 12 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  sessionHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sessionCountBadge: {
    backgroundColor: 'rgba(20,184,166,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sessionCountText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  cleanupButton: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  sessionsList: { gap: 10 },
  activeShieldBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(20,184,166,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.25)',
    borderRadius: 12,
    padding: 12,
  },
  activeShieldText: { fontSize: 12, color: COLORS.primary, fontWeight: '600', flex: 1 },
});
