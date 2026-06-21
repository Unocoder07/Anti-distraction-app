/**
 * Shield Screen - Complete Refactor
 * Smart distraction blocking with recommended apps, flexible duration, and safe mode
 */

import {
  ActiveSessionCard,
  AppCard,
  BreakSessionModal,
  CategoryFilter,
  DurationPicker,
  SafeModeIndicator,
  SessionCompleteModal,
  SessionStats,
} from '@/src/components/shield';
import { COLORS } from '@/src/constants/colors';
import { RADIUS, SPACING } from '@/src/constants/spacing';
import {
  getCategories,
  RECOMMENDED_APPS,
  RecommendedApp,
  searchApps,
} from '@/src/data/recommendedApps';
import { BlockedApp } from '@/src/services/shieldSessionManager';
import { useShieldStore } from '@/src/store/newShieldStore';
import { installedAppsFilter } from '@/src/services/installedAppsFilter';
import { Info, Play, Search, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Category = 'All' | 'Social Media' | 'Gaming' | 'Entertainment';

export default function ShieldScreen() {
  const {
    selectedApps,
    selectApp,
    deselectApp,
    clearSelection,
    isAppSelected,
    selectedDuration,
    setDuration,
    currentSession,
    timeRemaining,
    isSessionActive,
    startSession,
    endSession,
    removeBlockedApp,
    loadCurrentSession,
    inSafeMode,
    safeModeApp,
    isLoading,
    error,
    setError,
  } = useShieldStore();

  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completedCoins, setCompletedCoins] = useState(0);
  const [appsLoading, setAppsLoading] = useState(true);

  // Load session and installed apps on mount
  useEffect(() => {
    const initialize = async () => {
      loadCurrentSession();
      
      // Load installed apps
      if (!installedAppsFilter.isReady()) {
        await installedAppsFilter.loadInstalledApps();
      }
      setAppsLoading(false);
    };
    
    initialize();
  }, []);

  // Filter apps by category and search - ONLY INSTALLED APPS
  const filteredApps = useMemo(() => {
    // If apps are still loading, return empty array
    if (appsLoading) {
      return [];
    }

    let apps: RecommendedApp[] = [];

    // Filter by search first
    if (searchQuery.trim()) {
      apps = installedAppsFilter.searchInstalledApps(searchQuery);
    } else if (selectedCategory !== 'All') {
      // Filter by category
      apps = installedAppsFilter.getInstalledAppsByCategory(selectedCategory);
    } else {
      // Show all installed apps
      apps = installedAppsFilter.getInstalledRecommendedApps();
    }

    return apps;
  }, [selectedCategory, searchQuery, appsLoading]);

  // Toggle app selection
  const handleToggleApp = (app: RecommendedApp) => {
    const blockedApp: BlockedApp = {
      packageName: app.packageName,
      appName: app.name,
      icon: app.icon,
      category: app.category,
    };

    if (isAppSelected(app.packageName)) {
      deselectApp(app.packageName);
    } else {
      selectApp(blockedApp);
    }
  };

  // Start session
  const handleStartSession = async () => {
    if (selectedApps.length === 0) {
      setError('Please select at least one app to block');
      setTimeout(() => setError(null), 3000);
      return;
    }

    await startSession();
  };

  // End session (break early)
  const handleBreakSession = async () => {
    setShowBreakModal(false);
    const coinsLost = await endSession(true);
    // Show penalty notification (could add a penalty modal here)
    console.log(`Session broken. Lost ${coinsLost} coins.`);
  };

  // Auto-complete session when time runs out
  useEffect(() => {
    if (isSessionActive && timeRemaining === 0) {
      handleCompleteSession();
    }
  }, [isSessionActive, timeRemaining]);

  const handleCompleteSession = async () => {
    const coins = await endSession(false);
    setCompletedCoins(coins);
    setShowCompleteModal(true);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Shield</Text>
            <Text style={styles.subtitle}>Block distractions, stay focused</Text>
          </View>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Active Session Section */}
        {isSessionActive && currentSession ? (
          <View style={styles.activeSessionSection}>
            <Text style={styles.sectionTitle}>Active Session</Text>

            {/* Session Stats */}
            <SessionStats
              timeRemaining={timeRemaining}
              appsBlocked={currentSession.blockedApps.length}
              status={inSafeMode ? 'safe_mode' : 'active'}
            />

            {/* Safe Mode Indicator */}
            {inSafeMode && safeModeApp && <SafeModeIndicator appName={safeModeApp} />}

            {/* Blocked Apps List */}
            <View style={styles.blockedAppsList}>
              {currentSession.blockedApps.map((app) => (
                <ActiveSessionCard
                  key={app.packageName}
                  app={app}
                  timeRemaining={timeRemaining}
                  onDelete={() => removeBlockedApp(app.packageName)}
                />
              ))}
            </View>

            {/* End Session Button */}
            <Pressable
              style={({ pressed }) => [
                styles.endButton,
                pressed && styles.endButtonPressed,
              ]}
              onPress={() => setShowBreakModal(true)}
            >
              <Text style={styles.endButtonText}>End Session (-50 coins)</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* App Selection Section */}
            <View style={styles.selectionSection}>
              <Text style={styles.sectionTitle}>Select Apps to Block</Text>

              {/* Search Bar */}
              <View style={styles.searchBar}>
                <Search size={16} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search apps..."
                  placeholderTextColor={COLORS.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')}>
                    <X size={16} color={COLORS.textSecondary} />
                  </Pressable>
                )}
              </View>

              {/* Category Filter */}
              <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />

              {/* Selected Apps Count */}
              {selectedApps.length > 0 && (
                <View style={styles.selectedBar}>
                  <Text style={styles.selectedText}>
                    {selectedApps.length} app{selectedApps.length > 1 ? 's' : ''} selected
                  </Text>
                  <Pressable onPress={clearSelection}>
                    <Text style={styles.clearText}>Clear all</Text>
                  </Pressable>
                </View>
              )}

              {/* App Grid */}
              {appsLoading ? (
                <View style={styles.loadingState}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.loadingText}>Loading installed apps...</Text>
                </View>
              ) : (
                <>
                  <View style={styles.appGrid}>
                    {filteredApps.map((app) => (
                      <AppCard
                        key={app.packageName}
                        appName={app.name}
                        icon={app.icon}
                        category={app.category}
                        isSelected={isAppSelected(app.packageName)}
                        onToggle={() => handleToggleApp(app)}
                      />
                    ))}
                  </View>

                  {filteredApps.length === 0 && (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyIcon}>�</Text>
                      <Text style={styles.emptyText}>
                        {searchQuery.trim() 
                          ? 'No matching apps found'
                          : 'No social media or gaming apps installed'
                        }
                      </Text>
                      <Text style={styles.emptySubtext}>
                        Only installed apps appear in the list
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Duration Picker */}
            <View style={styles.durationSection}>
              <DurationPicker selected={selectedDuration} onSelect={setDuration} />
            </View>

            {/* Start Button */}
            <Pressable
              style={({ pressed }) => [
                styles.startButton,
                selectedApps.length === 0 && styles.startButtonDisabled,
                pressed && styles.startButtonPressed,
              ]}
              onPress={handleStartSession}
              disabled={selectedApps.length === 0 || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Play size={20} color="#fff" fill="#fff" />
                  <Text style={styles.startButtonText}>Start Focus Session</Text>
                </>
              )}
            </Pressable>

            {/* Banking Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoIconBox}>
                <Info size={16} color={COLORS.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Banking Apps Stay Safe</Text>
                <Text style={styles.infoText}>
                  When you open a banking or payment app, monitoring automatically pauses. Your
                  session continues without penalty.
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Modals */}
      <BreakSessionModal
        visible={showBreakModal}
        onCancel={() => setShowBreakModal(false)}
        onConfirm={handleBreakSession}
      />

      <SessionCompleteModal
        visible={showCompleteModal}
        coinsEarned={completedCoins}
        duration={selectedDuration}
        onClose={() => setShowCompleteModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollView: {
    flex: 1,
  },

  container: {
    paddingTop: 52,
    paddingHorizontal: SPACING.md,
    paddingBottom: 24,
    gap: SPACING.lg,
  },

  header: {
    marginBottom: SPACING.xs,
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
    marginTop: 2,
  },

  errorBox: {
    backgroundColor: `${COLORS.error}15`,
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
  },

  errorText: {
    fontSize: 12,
    color: COLORS.error,
    textAlign: 'center',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },

  // Active Session Styles
  activeSessionSection: {
    gap: SPACING.md,
  },

  blockedAppsList: {
    gap: SPACING.sm,
  },

  endButton: {
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.error,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },

  endButtonPressed: {
    opacity: 0.7,
  },

  endButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.error,
  },

  // Selection Section Styles
  selectionSection: {
    gap: SPACING.md,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    padding: 0,
  },

  selectedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: `${COLORS.primary}10`,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },

  selectedText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },

  clearText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.error,
  },

  appGrid: {
    gap: SPACING.sm,
  },

  loadingState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
    gap: SPACING.md,
  },

  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },

  emptyIcon: {
    fontSize: 48,
  },

  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },

  emptySubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // Duration Section
  durationSection: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },

  // Start Button
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
  },

  startButtonDisabled: {
    backgroundColor: COLORS.border,
    opacity: 0.5,
  },

  startButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },

  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    gap: SPACING.md,
    backgroundColor: `${COLORS.primary}10`,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
    borderRadius: RADIUS.md,
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
});
