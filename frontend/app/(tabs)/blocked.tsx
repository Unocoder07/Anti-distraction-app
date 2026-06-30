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
  PremiumModal,
  SessionCompleteModal,
  SessionStats,
} from '@/src/components/shield';
import { RADIUS, SPACING } from '@/src/constants/spacing';
import { RecommendedApp } from '@/src/data/recommendedApps';
import {
  BlockedApp,
  SHIELD_BREAK_PENALTY_COINS,
  calculateShieldReward,
} from '@/src/services/shieldSessionManager';
import { FREE_APP_LIMIT, useShieldStore } from '@/src/store/newShieldStore';
import { installedAppsFilter } from '@/src/services/installedAppsFilter';
import { useTheme } from '@/src/theme';
import type { ThemeColors } from '@/src/theme';
import { ArrowLeft, Play, Plus, Search, Shield as ShieldIcon, X } from 'lucide-react-native';
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

type Category = 'All' | 'Social Media' | 'Gaming' | 'Entertainment' | 'Short Video';

export default function ShieldScreen() {
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
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
    lastCompletedReward,
    startSession,
    endSession,
    removeBlockedApp,
    loadCurrentSession,
    isLoading,
    error,
    setError,
    addAppsToSession,
    clearCompletedReward,
    showPremiumModal,
    setShowPremiumModal,
    premiumModalReason,
    subscription,
    currentAppLimit,
    loadSubscription,
  } = useShieldStore();

  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completedCoins, setCompletedCoins] = useState(0);
  const [completedDuration, setCompletedDuration] = useState(selectedDuration);
  const [appsLoading, setAppsLoading] = useState(true);
  const [showAddApps, setShowAddApps] = useState(false);

  // Apps already blocked in the active session (0 when no session)
  const blockedCount = currentSession?.blockedApps.length ?? 0;
  const activeRewardCoins = calculateShieldReward(blockedCount);
  // True when we are adding apps on top of a running session
  const isAddingToSession = isSessionActive && !!currentSession && showAddApps;
  // Current-plan slots left for blocking more apps right now
  const slotsLeft = currentAppLimit === null ? null : Math.max(0, currentAppLimit - blockedCount);
  const blockedPackages = useMemo(
    () => new Set(currentSession?.blockedApps.map((app) => app.packageName) ?? []),
    [currentSession],
  );

  // Load session and installed apps on mount
  useEffect(() => {
    const initialize = async () => {
      await loadSubscription();
      await loadCurrentSession();
      
      // Load installed apps
      await installedAppsFilter.refresh();
      setAppsLoading(false);
    };
    
    initialize();
  }, [loadCurrentSession, loadSubscription]);

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
    if (isAddingToSession && blockedPackages.has(app.packageName)) {
      return;
    }

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

  // Open the "add more apps" selection while a session is running
  const handleOpenAddApps = () => {
    // Already at the free limit -> show premium upsell instead
    if (currentAppLimit !== null && blockedCount >= currentAppLimit) {
      setShowPremiumModal(true);
      return;
    }
    clearSelection();
    setSearchQuery('');
    setSelectedCategory('All');
    setShowAddApps(true);
  };

  // Cancel adding apps and return to the active session view
  const handleCancelAddApps = () => {
    clearSelection();
    setShowAddApps(false);
  };

  // Confirm adding the selected apps to the running session
  const handleConfirmAddApps = async () => {
    if (selectedApps.length === 0) {
      setError('Please select at least one app to add');
      setTimeout(() => setError(null), 3000);
      return;
    }
    await addAppsToSession();
    setShowAddApps(false);
  };

  // End session (break early)
  const handleBreakSession = async () => {
    setShowBreakModal(false);
    const coinsLost = await endSession(true);
    console.log(`Session broken. Lost ${coinsLost} coins.`);
  };

  useEffect(() => {
    if (!lastCompletedReward) {
      return;
    }

    setCompletedCoins(lastCompletedReward.coins);
    setCompletedDuration(lastCompletedReward.duration);
    setShowCompleteModal(true);
  }, [lastCompletedReward]);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIconBox}>
            <ShieldIcon size={24} color={COLORS.primary} fill={`${COLORS.primary}20`} />
          </View>
          <View style={styles.headerText}>
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
        {isSessionActive && currentSession && !showAddApps ? (
          <View style={styles.activeSessionSection}>
            <Text style={styles.sectionTitle}>Active Session</Text>

            {/* Session Stats */}
            <SessionStats
              timeRemaining={timeRemaining}
              appsBlocked={currentSession.blockedApps.length}
              status="active"
              rewardCoins={activeRewardCoins}
            />

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

            {/* Add Another App to Block */}
            <Pressable
              style={({ pressed }) => [
                styles.addButton,
                pressed && styles.addButtonPressed,
              ]}
              onPress={handleOpenAddApps}
            >
              <Plus size={18} color={COLORS.primary} />
              <Text style={styles.addButtonText}>
                {currentAppLimit !== null && blockedCount >= currentAppLimit
                  ? 'Block more apps (Premium)'
                  : `Add app to block (${slotsLeft === null ? 'unlimited' : slotsLeft} left)`}
              </Text>
            </Pressable>

            {/* End Session Button */}
            <Pressable
              style={({ pressed }) => [
                styles.endButton,
                pressed && styles.endButtonPressed,
              ]}
              onPress={() => setShowBreakModal(true)}
            >
              <Text style={styles.endButtonText}>
                End Session (-{SHIELD_BREAK_PENALTY_COINS} coins)
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* App Selection Section */}
            <View style={styles.selectionSection}>
              {isAddingToSession ? (
                <View style={styles.addHeaderRow}>
                  <Pressable
                    style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
                    onPress={handleCancelAddApps}
                  >
                    <ArrowLeft size={20} color={COLORS.text} />
                  </Pressable>
                  <View style={styles.addHeaderText}>
                    <Text style={styles.sectionTitle}>Add Apps to Block</Text>
                    <Text style={styles.addHeaderHint}>
                      {slotsLeft === null
                        ? 'Unlimited premium slots available'
                        : `${slotsLeft} of ${currentAppLimit} slots remaining`}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.sectionTitle}>Select Apps to Block</Text>
              )}

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
                        isSelected={isAppSelected(app.packageName) || (isAddingToSession && blockedPackages.has(app.packageName))}
                        onToggle={() => handleToggleApp(app)}
                      />
                    ))}
                  </View>

                  {filteredApps.length === 0 && (
                    <View style={styles.emptyState}>
                      <View style={styles.emptyIconBox}>
                        <ShieldIcon size={28} color={COLORS.primary} />
                      </View>
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

            {/* Duration Picker - only when starting a new session */}
            {!isAddingToSession && (
              <View style={styles.durationSection}>
                <DurationPicker selected={selectedDuration} onSelect={setDuration} />
              </View>
            )}

            {/* Primary Action Button */}
            {isAddingToSession ? (
              <Pressable
                style={({ pressed }) => [
                  styles.startButton,
                  selectedApps.length === 0 && styles.startButtonDisabled,
                  pressed && styles.startButtonPressed,
                ]}
                onPress={handleConfirmAddApps}
                disabled={selectedApps.length === 0 || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Plus size={20} color="#fff" />
                    <Text style={styles.startButtonText}>
                      Add to Session
                      {selectedApps.length > 0 ? ` (${selectedApps.length})` : ''}
                    </Text>
                  </>
                )}
              </Pressable>
            ) : (
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
            )}
          </>
        )}
      </ScrollView>

      {/* Modals */}
      <BreakSessionModal
        visible={showBreakModal}
        penaltyCoins={SHIELD_BREAK_PENALTY_COINS}
        rewardCoins={activeRewardCoins}
        onCancel={() => setShowBreakModal(false)}
        onConfirm={handleBreakSession}
      />

      <SessionCompleteModal
        visible={showCompleteModal}
        coinsEarned={completedCoins}
        duration={completedDuration}
        onClose={() => {
          setShowCompleteModal(false);
          clearCompletedReward();
        }}
      />

      <PremiumModal
        visible={showPremiumModal}
        currentPlan={subscription}
        currentAppLimit={currentAppLimit}
        freeAppLimit={FREE_APP_LIMIT}
        blockedAppsCount={blockedCount}
        selectedAppsCount={selectedApps.length}
        reason={premiumModalReason}
        onClose={() => setShowPremiumModal(false)}
      />
    </View>
  );
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.xs,
  },

  headerIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: `${COLORS.primary}12`,
    borderWidth: 1,
    borderColor: `${COLORS.primary}25`,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerText: {
    flex: 1,
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

  // Add App Button (active session)
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: `${COLORS.primary}10`,
    borderWidth: 1,
    borderColor: `${COLORS.primary}40`,
    marginTop: SPACING.sm,
  },

  addButtonPressed: {
    opacity: 0.7,
  },

  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Add-mode header
  addHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },

  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backButtonPressed: {
    opacity: 0.6,
  },

  addHeaderText: {
    flex: 1,
  },

  addHeaderHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
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

  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}12`,
    alignItems: 'center',
    justifyContent: 'center',
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
});
