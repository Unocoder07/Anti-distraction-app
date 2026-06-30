// Route: "/achievement-levels" → Achievement Levels Screen
import { RADIUS, SPACING } from '@/src/constants/spacing';
import { profileService } from '@/src/services/profileService';
import { useAuthStore } from '@/src/store/authStore';
import { useTheme } from '@/src/theme';
import type { ThemeColors } from '@/src/theme';
import { router } from 'expo-router';
import { ArrowLeft, Award, CheckCircle, Lock, TrendingUp } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

interface AchievementLevel {
  id: string;
  tier: string;
  rank: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  coinsRequired: number;
  sessionsRequired: number;
  unlocked: boolean;
  current?: boolean;
}

const ACHIEVEMENT_LEVELS: AchievementLevel[] = [
  {
    id: '1',
    tier: 'Bronze',
    rank: 1,
    name: 'Novice Learner',
    description: 'Begin your journey to mastery',
    icon: '🥉',
    color: '#cd7f32',
    coinsRequired: 0,
    sessionsRequired: 0,
    unlocked: true,
  },
  {
    id: '2',
    tier: 'Bronze',
    rank: 2,
    name: 'Eager Student',
    description: 'Show consistent dedication',
    icon: '🥉',
    color: '#cd7f32',
    coinsRequired: 100,
    sessionsRequired: 5,
    unlocked: true,
  },
  {
    id: '3',
    tier: 'Bronze',
    rank: 3,
    name: 'Committed Learner',
    description: 'Prove your commitment',
    icon: '🥉',
    color: '#cd7f32',
    coinsRequired: 250,
    sessionsRequired: 12,
    unlocked: true,
  },
  {
    id: '4',
    tier: 'Silver',
    rank: 1,
    name: 'Rising Scholar',
    description: 'Enter the silver tier',
    icon: '🥈',
    color: '#c0c0c0',
    coinsRequired: 500,
    sessionsRequired: 25,
    unlocked: true,
  },
  {
    id: '5',
    tier: 'Silver',
    rank: 2,
    name: 'Focused Mind',
    description: 'Master the art of concentration',
    icon: '🥈',
    color: '#c0c0c0',
    coinsRequired: 800,
    sessionsRequired: 40,
    unlocked: true,
  },
  {
    id: '6',
    tier: 'Silver',
    rank: 3,
    name: 'Disciplined Scholar',
    description: 'Discipline becomes second nature',
    icon: '🥈',
    color: '#c0c0c0',
    coinsRequired: 1200,
    sessionsRequired: 60,
    unlocked: true,
    current: true,
  },
  {
    id: '7',
    tier: 'Gold',
    rank: 1,
    name: 'Elite Learner',
    description: 'Join the elite ranks',
    icon: '🥇',
    color: '#ffd700',
    coinsRequired: 1800,
    sessionsRequired: 90,
    unlocked: false,
  },
  {
    id: '8',
    tier: 'Gold',
    rank: 2,
    name: 'Master Scholar',
    description: 'Achieve mastery in focus',
    icon: '🥇',
    color: '#ffd700',
    coinsRequired: 2500,
    sessionsRequired: 125,
    unlocked: false,
  },
  {
    id: '9',
    tier: 'Gold',
    rank: 3,
    name: 'Dedicated Scholar',
    description: 'Unwavering dedication to excellence',
    icon: '🥇',
    color: '#ffd700',
    coinsRequired: 3500,
    sessionsRequired: 175,
    unlocked: false,
  },
  {
    id: '10',
    tier: 'Platinum',
    rank: 1,
    name: 'Legendary Mind',
    description: 'Transcend ordinary limits',
    icon: '💎',
    color: '#e5e4e2',
    coinsRequired: 5000,
    sessionsRequired: 250,
    unlocked: false,
  },
  {
    id: '11',
    tier: 'Platinum',
    rank: 2,
    name: 'Enlightened Scholar',
    description: 'Reach enlightenment through focus',
    icon: '💎',
    color: '#e5e4e2',
    coinsRequired: 7500,
    sessionsRequired: 375,
    unlocked: false,
  },
  {
    id: '12',
    tier: 'Platinum',
    rank: 3,
    name: 'Transcendent Master',
    description: 'The pinnacle of achievement',
    icon: '💎',
    color: '#e5e4e2',
    coinsRequired: 10000,
    sessionsRequired: 500,
    unlocked: false,
  },
  {
    id: '13',
    tier: 'Diamond',
    rank: 1,
    name: 'Immortal Legend',
    description: 'Your name echoes through eternity',
    icon: '💠',
    color: '#b9f2ff',
    coinsRequired: 15000,
    sessionsRequired: 750,
    unlocked: false,
  },
];

export default function AchievementLevelsScreen() {
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const { user } = useAuthStore();
  const [currentCoins, setCurrentCoins] = useState(0);
  const [currentSessions, setCurrentSessions] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    profileService.getUserProfile(user.userId).then((profile) => {
      setCurrentCoins(profile.focusPoints);
      setCurrentSessions(profile.totalSessions);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const levels = useMemo(() => {
    const withUnlocked = ACHIEVEMENT_LEVELS.map((level) => ({
      ...level,
      unlocked:
        currentCoins >= level.coinsRequired && currentSessions >= level.sessionsRequired,
    }));
    const currentIndex = withUnlocked.map((l) => l.unlocked).lastIndexOf(true);
    return withUnlocked.map((level, index) => ({
      ...level,
      current: index === currentIndex && level.unlocked,
    }));
  }, [currentCoins, currentSessions]);

  const calculateProgress = (level: AchievementLevel) => {
    if (level.unlocked) return 100;

    const coinProgress = level.coinsRequired
      ? (currentCoins / level.coinsRequired) * 100
      : 100;
    const sessionProgress = level.sessionsRequired
      ? (currentSessions / level.sessionsRequired) * 100
      : 100;

    return Math.min(Math.round((coinProgress + sessionProgress) / 2), 100);
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Achievement Levels</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Award size={24} color={COLORS.primary} />
            <View style={styles.progressInfo}>
              <Text style={styles.progressTitle}>Your Progress</Text>
              <Text style={styles.progressSubtitle}>Keep pushing forward!</Text>
            </View>
          </View>
          <View style={styles.progressStats}>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>{currentCoins.toLocaleString()}</Text>
              <Text style={styles.progressStatLabel}>Focus Coins</Text>
            </View>
            <View style={styles.progressDivider} />
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>{currentSessions}</Text>
              <Text style={styles.progressStatLabel}>Sessions</Text>
            </View>
          </View>
        </View>

        {/* Achievement Levels List */}
        <Text style={styles.sectionTitle}>All Achievement Levels</Text>

        {levels.map((level, index) => {
          const progress = calculateProgress(level);
          const isNextLevel = !level.unlocked && index > 0 && levels[index - 1].unlocked;

          return (
            <View
              key={level.id}
              style={[
                styles.levelCard,
                level.current && styles.levelCardCurrent,
                !level.unlocked && styles.levelCardLocked,
              ]}
            >
              {/* Level Header */}
              <View style={styles.levelHeader}>
                <View style={styles.levelLeft}>
                  <View
                    style={[
                      styles.levelIconBox,
                      { backgroundColor: level.unlocked ? `${level.color}20` : COLORS.card },
                      level.current && { borderWidth: 2, borderColor: level.color },
                    ]}
                  >
                    <Text style={styles.levelIcon}>{level.icon}</Text>
                    {level.unlocked && !level.current && (
                      <View style={styles.checkBadge}>
                        <CheckCircle size={16} color="#10b981" />
                      </View>
                    )}
                    {!level.unlocked && (
                      <View style={styles.lockBadge}>
                        <Lock size={14} color={COLORS.textSecondary} />
                      </View>
                    )}
                  </View>
                  <View style={styles.levelInfo}>
                    <View style={styles.levelTitleRow}>
                      <Text
                        style={[
                          styles.levelTier,
                          { color: level.unlocked ? level.color : COLORS.textSecondary },
                        ]}
                      >
                        {level.tier} {level.rank}
                      </Text>
                      {level.current && (
                        <View style={styles.currentBadge}>
                          <Text style={styles.currentBadgeText}>CURRENT</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.levelName}>{level.name}</Text>
                    <Text style={styles.levelDescription}>{level.description}</Text>
                  </View>
                </View>
              </View>

              {/* Requirements */}
              {!level.unlocked && (
                <View style={styles.requirements}>
                  <Text style={styles.requirementsTitle}>Requirements to Unlock:</Text>
                  <View style={styles.requirementsList}>
                    <View style={styles.requirementItem}>
                      <TrendingUp size={14} color={COLORS.primary} />
                      <Text style={styles.requirementText}>
                        {level.coinsRequired.toLocaleString()} Focus Coins
                      </Text>
                      <Text
                        style={[
                          styles.requirementProgress,
                          currentCoins >= level.coinsRequired && styles.requirementComplete,
                        ]}
                      >
                        {currentCoins >= level.coinsRequired ? '✓' : `${currentCoins}/${level.coinsRequired}`}
                      </Text>
                    </View>
                    <View style={styles.requirementItem}>
                      <TrendingUp size={14} color={COLORS.primary} />
                      <Text style={styles.requirementText}>
                        {level.sessionsRequired} Focus Sessions
                      </Text>
                      <Text
                        style={[
                          styles.requirementProgress,
                          currentSessions >= level.sessionsRequired && styles.requirementComplete,
                        ]}
                      >
                        {currentSessions >= level.sessionsRequired
                          ? '✓'
                          : `${currentSessions}/${level.sessionsRequired}`}
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  {isNextLevel && (
                    <View style={styles.progressBarContainer}>
                      <View style={styles.progressBarTrack}>
                        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                      </View>
                      <Text style={styles.progressBarText}>{progress}% Complete</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Unlocked Badge */}
              {level.unlocked && !level.current && (
                <View style={styles.unlockedBadge}>
                  <CheckCircle size={16} color="#10b981" />
                  <Text style={styles.unlockedText}>Unlocked</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  spacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  progressCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  progressSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  progressStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  progressStat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  progressStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  progressStatLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
  },
  levelCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  levelCardCurrent: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: `${COLORS.primary}08`,
  },
  levelCardLocked: {
    opacity: 0.7,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  levelLeft: {
    flex: 1,
    flexDirection: 'row',
    gap: SPACING.md,
  },
  levelIconBox: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  levelIcon: {
    fontSize: 28,
  },
  checkBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 2,
  },
  lockBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 4,
  },
  levelInfo: {
    flex: 1,
    gap: 4,
  },
  levelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelTier: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  currentBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  currentBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.background,
    letterSpacing: 0.5,
  },
  levelName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  levelDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  requirements: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  requirementsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  requirementsList: {
    gap: SPACING.sm,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text,
  },
  requirementProgress: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  requirementComplete: {
    color: '#10b981',
  },
  progressBarContainer: {
    marginTop: SPACING.sm,
    gap: 6,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressBarText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
  },
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderRadius: RADIUS.sm,
  },
  unlockedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
});
