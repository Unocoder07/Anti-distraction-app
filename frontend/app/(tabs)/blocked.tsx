// Route: "/blocked-apps" → BlockedApps
import { ActiveSessionCard } from '@/src/components/blocked/ActiveSessionCard';
import type { BlockedApp } from '@/src/components/blocked/BlockedAppCard';
import { BlockedAppCard } from '@/src/components/blocked/BlockedAppCard';
import { BlockingSessionDialog } from '@/src/components/blocked/BlockingSessionDialog';
import { UnlockDialog } from '@/src/components/blocked/UnlockDialog';
import { COLORS } from '@/src/constants/colors';
import { MOCK_BLOCKED_APPS } from '@/src/constants/mockData';
import { RADIUS, SPACING } from '@/src/constants/spacing';
import { appMonitorService } from '@/src/services/appMonitorService';
import { DEFAULT_SESSION_DURATION } from '@/src/services/blockingService';
import { getAllInstalledApps } from '@/src/services/installedAppsService';
import { storage, STORAGE_KEYS } from '@/src/services/storage';
import { useAuthStore, useBlockingStore } from '@/src/store';
import { Info, Monitor, Shield, Smartphone } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
export default function BlockedAppsScreen() {
  const { user } = useAuthStore();
  const { apps, activeSessions, loadBlockedApps, toggleApp, startSession, breakSession, completeSession, cleanupStaleSessions, saveUserBlockedApps } = useBlockingStore();

  const [detoxMode, setDetoxMode] = useState(false);
  const [unlockTarget, setUnlockTarget] = useState<BlockedApp | null>(null);
  const [sessionTarget, setSessionTarget] = useState<BlockedApp | null>(null);
  const [sessionDuration] = useState(DEFAULT_SESSION_DURATION);
  const [detectingApps, setDetectingApps] = useState(false);
  const [detectedAppsCount, setDetectedAppsCount] = useState(0);

  // Load apps from storage on mount
  useEffect(() => {
    if (user) {
      initializeApps();
    }
    loadDetoxMode();
  }, [user]);

  const initializeApps = async () => {
    setDetectingApps(true);

    try {
      // 1. Get ONLY apps that are actually installed on the student's phone
      const installedApps = await getAllInstalledApps();

      console.log(`📱 Found ${installedApps.length} matched distracting apps installed on device`);

      // 2. Convert to BlockedApp format
      const detectedBlockedApps: BlockedApp[] = installedApps.map(app => ({
        id: parseInt(app.id) || Math.floor(Math.random() * 1000000), // Ensure we have an ID
        name: app.name,
        category: app.category,
        icon: app.icon || '📱',
        blocked: false,
        packageName: app.packageName,
        bundleId: app.bundleId,
      }));

      setDetectedAppsCount(detectedBlockedApps.length);

      if (user) {
        // 3. Load current saved apps from backend
        const savedApps = apps.length > 0 ? apps : [];

        // 4. Merge: keep status of already saved apps, add new detected ones
        const mergedApps = [...detectedBlockedApps];

        // Update merged list with any existing "blocked" statuses from backend
        savedApps.forEach(saved => {
          const index = mergedApps.findIndex(a => a.packageName === saved.packageName);
          if (index !== -1) {
            mergedApps[index].blocked = saved.blocked;
          }
        });

        console.log('💾 Saving/Updating detected apps to backend...');
        await saveUserBlockedApps(user.userId, mergedApps);
        await loadBlockedApps(user.userId);
      } else {
        await loadLocalApps(detectedBlockedApps);
      }
    } catch (error) {
      console.error('Error initializing apps:', error);
      Alert.alert('Detection Error', 'Failed to scan for installed apps. Please check permissions.');
    } finally {
      setDetectingApps(false);
    }
  };

  const loadLocalApps = async (defaultApps: BlockedApp[] = MOCK_BLOCKED_APPS) => {
    try {
      const saved = await storage.load<BlockedApp[]>(STORAGE_KEYS.BLOCKED_APPS);
      if (!saved || saved.length === 0) {
        await storage.save(STORAGE_KEYS.BLOCKED_APPS, defaultApps);
      }
    } catch (error) {
      console.error('Error loading blocked apps:', error);
    }
  };

  const loadDetoxMode = async () => {
    try {
      const settings = await storage.load<{ detoxMode: boolean }>(STORAGE_KEYS.SETTINGS);
      if (settings?.detoxMode !== undefined) {
        setDetoxMode(settings.detoxMode);
      }
    } catch (error) {
      console.error('Error loading detox mode:', error);
    }
  };

  const saveDetoxMode = async (enabled: boolean) => {
    try {
      const settings = (await storage.load<any>(STORAGE_KEYS.SETTINGS)) || {};
      settings.detoxMode = enabled;
      await storage.save(STORAGE_KEYS.SETTINGS, settings);
      setDetoxMode(enabled);
    } catch (error) {
      console.error('Error saving detox mode:', error);
    }
  };

  const handleToggleApp = async (id: number) => {
    const app = apps.find(a => a.id === id);
    if (!app) return;

    if (!app.blocked) {
      // Show warning before blocking
      Alert.alert(
        '🛡️ Block this app?',
        `Are you sure you want to block ${app.name}?\n\n` +
        `⚠️ WARNING:\n` +
        `• Completing a session: +20 Focus Coins\n` +
        `• Breaking a session: -50 Focus Coins\n\n` +
        `The block is VERY strong and cannot be easily undone during a session.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes, Block it',
            style: 'destructive',
            onPress: async () => {
              if (user) {
                await toggleApp(user.userId, id);
              } else {
                const currentApps = apps.length > 0 ? apps : MOCK_BLOCKED_APPS;
                const updated = currentApps.map((a) => (a.id === id ? { ...a, blocked: !a.blocked } : a));
                await storage.save(STORAGE_KEYS.BLOCKED_APPS, updated);
              }
            }
          }
        ]
      );
    } else {
      // Simple toggle if already blocked (unblocking from list)
      if (user) {
        await toggleApp(user.userId, id);
      } else {
        const currentApps = apps.length > 0 ? apps : MOCK_BLOCKED_APPS;
        const updated = currentApps.map((a) => (a.id === id ? { ...a, blocked: !a.blocked } : a));
        await storage.save(STORAGE_KEYS.BLOCKED_APPS, updated);
      }
    }
  };

  const handleDetoxToggle = async (value: boolean) => {
    await saveDetoxMode(value);
    if (value && user) {
      // Block all apps when detox mode is enabled
      const updated = apps.map((a) => ({ ...a, blocked: true }));
      await storage.save(STORAGE_KEYS.BLOCKED_APPS, updated);
    }
  };

  const handleStartSession = async (app: BlockedApp, duration: number) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to start blocking sessions and earn rewards.');
      setSessionTarget(null);
      return;
    }

    try {
      await startSession(user.userId, app.id, app.name, duration);
      setSessionTarget(null);

      // Reload to show active session
      await loadBlockedApps(user.userId);

      // Start monitoring for app switches - monitor ALL blocked apps
      const blockedAppsForMonitoring = displayApps
        .filter(a => a.blocked)
        .map(a => ({
          packageName: a.packageName || '',
          appName: a.name,
        }));

      await appMonitorService.startMonitoring(
        blockedAppsForMonitoring,
        (appName) => {
          console.log(`⚠️ User attempted to open: ${appName}`);
          // Could track this in Firebase for analytics
        }
      );

      Alert.alert(
        '🛡️ Blocking Session Started!',
        `${app.name} and ALL blocked apps are now locked for ${duration} minutes.\n\n` +
        `⚠️ HOW THIS WORKS:\n\n` +
        `✅ You can switch apps to:\n` +
        `   • Attend calls\n` +
        `   • Reply to important messages\n` +
        `   • Use productivity apps\n\n` +
        `❌ You CANNOT open:\n` +
        `   • ${displayApps.filter(a => a.blocked).map(a => a.name).join(', ')}\n\n` +
        `💡 If you try to open ANY blocked app:\n` +
        `   • You'll get a warning when you return\n` +
        `   • Choose: Admit & lose 50 FP OR claim you stayed focused\n\n` +
        `🎯 Complete the session = Earn 20 FP!\n\n` +
        `⏱️ Session ends in ${duration} minutes. Stay strong!`,
        [{ text: 'Start Focus Session!' }]
      );
    } catch (error) {
      console.error('Error starting session:', error);
      Alert.alert('Error', 'Failed to start blocking session. Please try again.');
    }
  };

  const handleUnlockAttempt = async (app: BlockedApp) => {
    const session = activeSessions.get(app.id);
    if (session && user) {
      setUnlockTarget(app);
    }
  };

  const handleConfirmUnlock = async (app: BlockedApp) => {
    const session = activeSessions.get(app.id);
    if (session && user) {
      try {
        const fpLost = await breakSession(session.id, user.userId, app.id);
        setUnlockTarget(null);

        // Stop monitoring
        appMonitorService.stopMonitoring();

        // Reload home data to reflect FP change
        await loadBlockedApps(user.userId);

        Alert.alert(
          'Session Broken 💔',
          `You lost ${fpLost} Focus Points for breaking your blocking session. Stay strong next time!`,
          [{ text: 'I understand' }]
        );
      } catch (error) {
        console.error('Error breaking session:', error);
        Alert.alert('Error', 'Failed to break session. Please try again.');
      }
    }
  };

  const handleSessionComplete = async (sessionId: string) => {
    if (!user) return;

    try {
      // Find the session to get appId
      const session = activeSessionsArray.find(s => s.id === sessionId);
      if (!session) return;

      const fpEarned = await completeSession(sessionId, user.userId, session.appId);

      // Stop monitoring
      appMonitorService.stopMonitoring();

      // Reload sessions
      await loadBlockedApps(user.userId);

      Alert.alert(
        'Session Complete! 🎉',
        `Congratulations! You earned ${fpEarned} Focus Points for completing your blocking session!`,
        [{ text: 'Awesome!' }]
      );
    } catch (error) {
      console.error('Error completing session:', error);
    }
  };

  const handleCleanupSessions = async () => {
    if (!user) return;

    Alert.alert(
      'Clean Up Sessions?',
      'This will remove all active blocking sessions without penalty. Use this to clear test/dummy sessions.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clean Up',
          style: 'destructive',
          onPress: async () => {
            try {
              const count = await cleanupStaleSessions(user.userId);
              await loadBlockedApps(user.userId);
              Alert.alert('Cleaned Up', `Removed ${count} stale session(s)`);
            } catch (error) {
              console.error('Error cleaning up sessions:', error);
              Alert.alert('Error', 'Failed to clean up sessions');
            }
          },
        },
      ]
    );
  };

  const displayApps = apps.length > 0 ? apps : [];
  const blockedCount = displayApps.filter((a) => a.blocked).length;
  const activeSessionsArray = Array.from(activeSessions.values());

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Shield</Text>
          <Text style={styles.subtitle}>Smart Focus Blocking System</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{blockedCount} blocked</Text>
        </View>
      </View>

      {/* ── Dopamine Detox Master Switch ── */}
      <View style={[styles.detoxCard, detoxMode && styles.detoxCardActive]}>
        <View style={styles.detoxTop}>
          <View style={styles.detoxLeft}>
            <View style={[styles.detoxIcon, detoxMode && styles.detoxIconActive]}>
              <Shield size={20} color={detoxMode ? COLORS.primary : COLORS.textSecondary} />
            </View>
            <View>
              <Text style={styles.detoxTitle}>Dopamine Detox Mode</Text>
              <Text style={styles.detoxSub}>Strict mode enabled globally</Text>
            </View>
          </View>
          <Switch
            value={detoxMode}
            onValueChange={handleDetoxToggle}
            trackColor={{ false: COLORS.card, true: '#0d9488' }}
            thumbColor={detoxMode ? COLORS.primary : COLORS.textSecondary}
          />
        </View>

        {detoxMode && (
          <View style={styles.detoxFeatures}>
            <FeatureRow icon={<Smartphone size={14} color={COLORS.primary} />} text="Grayscale Mode Active" />
            <FeatureRow icon={<Monitor size={14} color={COLORS.primary} />} text="Short-video algorithmic blocking" />
            <FeatureRow icon={<Info size={14} color={COLORS.primary} />} text="Notification suppression ON" />
          </View>
        )}
      </View>

      {/* ── Info Card ── */}
      <View style={styles.infoCard}>
        <View style={styles.infoIconBox}>
          {detectingApps ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Info size={16} color={COLORS.primary} />
          )}
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>
            {detectingApps ? 'Scanning Device...' : detectedAppsCount > 0 ? '🛡️ How Shield Blocking Works' : '📱 App Detection Info'}
          </Text>
          <Text style={styles.infoText}>
            {detectingApps
              ? 'Scanning your phone for social media, gaming, and entertainment apps...'
              : detectedAppsCount > 0
                ? `${detectedAppsCount} distracting apps found on your phone.\n\n` +
                `📱 HOW IT WORKS:\n\n` +
                `1️⃣ Toggle apps you want to BLOCK\n` +
                `2️⃣ Tap blocked app to start session (e.g., 50 min)\n` +
                `3️⃣ Session starts - ALL blocked apps are locked\n\n` +
                `✅ YOU CAN:\n` +
                `• Switch to other apps (calls, messages, productivity)\n` +
                `• Use your phone normally\n\n` +
                `⚠️ WARNING SYSTEM:\n` +
                `• When you return, you'll be asked if you opened blocked apps\n` +
                `• Be honest: Admit = -50 FP | Stay focused = +20 FP\n\n` +
                `💪 Build SELF-CONTROL through accountability!`
                : 'No distracting apps detected on your device.\n\n' +
                `This could mean:\n` +
                `• You don't have social media/gaming apps installed ✅\n` +
                `• You're using Expo Go (requires EAS build for detection)\n` +
                `• App detection needs to be enabled\n\n` +
                `To enable full app detection:\n` +
                `1. Build with EAS: eas build --profile development\n` +
                `2. Install the APK on your device\n` +
                `3. Grant necessary permissions\n\n` +
                `Great job staying focused! 🎯`}
          </Text>
        </View>
      </View>

      {/* ── Active Sessions ── */}
      {activeSessionsArray.length > 0 && (
        <View style={styles.sessionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Blocking Sessions</Text>
            <View style={styles.sessionHeaderRight}>
              <View style={styles.sessionCountBadge}>
                <Text style={styles.sessionCountText}>{activeSessionsArray.length}</Text>
              </View>
              <Text style={styles.cleanupButton} onPress={handleCleanupSessions}>
                🧹
              </Text>
            </View>
          </View>
          <View style={styles.sessionsList}>
            {activeSessionsArray.map((session, index) => {
              const app = displayApps.find(a => a.id === session.appId);
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
        </View>
      )}

      {/* ── App List Header ── */}
      <View style={styles.listHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.listTitle}>
            {displayApps.length > 0 ? 'Recommended Applications' : 'No Apps Detected'}
          </Text>
          <Text style={styles.listSub}>
            {displayApps.length > 0
              ? 'Showing all detected social media & gaming apps'
              : 'Loading recommended apps...'}
          </Text>
        </View>
      </View>

      {/* ── App Cards ── */}
      {displayApps.length > 0 ? (
        <View style={styles.appList}>
          {displayApps.map((app) => {
            const hasActiveSession = activeSessions.has(app.id);
            return (
              <View key={`app-${app.id}`}>
                <BlockedAppCard
                  app={app}
                  onToggle={(id) => {
                    // If there's an active session, show unlock dialog
                    if (hasActiveSession) {
                      setUnlockTarget(app);
                    } else if (app.blocked) {
                      // If app is blocked, start a session
                      setSessionTarget(app);
                    } else {
                      // Otherwise toggle the app blocking status
                      handleToggleApp(id);
                    }
                  }}
                  focusActive={hasActiveSession}
                  onUnlockAttempt={handleUnlockAttempt}
                />
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎉</Text>
          <Text style={styles.emptyTitle}>No Distracting Apps Found!</Text>
          <Text style={styles.emptyText}>
            Great news! We could not find any social media, gaming, or entertainment apps on your device.

          </Text>
          <Text style={styles.emptyHint}>
            Either you are already focused, or you need to build the app with EAS to enable full app detection.
          </Text>
          <Text style={[styles.emptyHint, { marginTop: 12, fontStyle: 'normal', fontWeight: '600' }]}>
            💡 To detect installed apps: Build with EAS and install the APK
          </Text>
        </View>
      )}

      {/* ── Blocking Session Dialog ── */}
      <BlockingSessionDialog
        visible={!!sessionTarget}
        app={sessionTarget}
        duration={sessionDuration}
        onStartSession={handleStartSession}
        onDismiss={() => setSessionTarget(null)}
      />

      {/* ── Unlock Dialog ── */}
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

function FeatureRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={styles.featureRow}>
      {icon}
      <Text style={styles.featureText}>{text}</Text>
    </View>
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
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  countBadge: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 4,
  },
  countText: { fontSize: 11, fontWeight: '700', color: '#f87171' },

  // Detox card
  detoxCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 18,
  },
  detoxCardActive: {
    backgroundColor: 'rgba(19,78,74,0.2)',
    borderColor: 'rgba(20,184,166,0.35)',
  },
  detoxTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detoxLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  detoxIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detoxIconActive: { backgroundColor: 'rgba(20,184,166,0.15)' },
  detoxTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  detoxSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  detoxFeatures: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(20,184,166,0.2)',
    gap: 8,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 12, color: '#99f6e4' },

  // Info card
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
  infoContent: {
    flex: 1,
    gap: 4,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  infoText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },

  // List header
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  listTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  listSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },

  appList: { gap: 10 },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyHint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 4,
  },

  // Sessions section
  sessionsSection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  sessionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionCountBadge: {
    backgroundColor: 'rgba(20,184,166,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sessionCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  cleanupButton: {
    fontSize: 18,
    padding: 4,
  },
  sessionsList: {
    gap: 10,
  },
});
