// Route: "/" → Home
import { StreakCalendar } from '@/src/components/calendar/StreakCalendar';
import { DailyGoalCard, type DailyGoal } from '@/src/components/home/DailyGoalCard';
import { StatsGrid } from '@/src/components/home/StatsGrid';
import { MOCK_GOALS } from '@/src/constants/mockData';
import { useAuthStore, useHomeStore } from '@/src/store';
import { useTheme } from '@/src/theme';
import type { ThemeColors } from '@/src/theme';
import { toLocalMonthKey } from '@/src/utils/time';
import { router } from 'expo-router';
import { BarChart3, ChevronRight, Zap } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const clampDirectiveDuration = (minutes: number) =>
  Math.max(5, Math.min(120, Math.round(minutes)));

const getRemainingDirectiveMinutes = (goal: DailyGoal) => {
  const remaining = goal.total - goal.progress;

  if (goal.unit === 'min' || goal.unit === 'm') {
    return clampDirectiveDuration(remaining > 0 ? remaining : goal.total);
  }

  return 25;
};

const getDirectiveFocusParams = (goal: DailyGoal) => {
  const baseParams = {
    source: 'daily-directive',
    directiveId: goal.id,
    directiveTitle: goal.title,
  };

  if (goal.type === 'time') {
    return {
      ...baseParams,
      flow: 'time-investment',
      durationMinutes: String(getRemainingDirectiveMinutes(goal)),
    };
  }

  if (goal.type === 'deep-work') {
    return {
      ...baseParams,
      flow: 'time-investment',
      durationMinutes: '90',
    };
  }

  if (goal.type === 'custom') {
    return {
      ...baseParams,
      flow: 'custom-target',
      durationMinutes: '25',
    };
  }

  if (!goal.type || goal.type === 'session') {
    return {
      ...baseParams,
      flow: 'focus-starter',
    };
  }

  return null;
};

export default function HomeScreen() {
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  // Get user from auth store
  const { user } = useAuthStore();

  // Get home data from home store
  const {
    userStats,
    dailyChallenges,
    progressMarks,
    streakInfo,
    loading,
    loadHomeData,
    completeDailyChallenge,
    createCustomChallenge
  } = useHomeStore();

  const [currentMonth] = useState(() => new Date());
  const [completingGoalId, setCompletingGoalId] = useState<string | null>(null);
  const [creatingGoal, setCreatingGoal] = useState(false);
  const currentMonthKey = useMemo(() => toLocalMonthKey(currentMonth), [currentMonth]);
  const currentMonthMarks = useMemo(
    () => progressMarks.filter((mark) => mark.date.startsWith(currentMonthKey)),
    [currentMonthKey, progressMarks],
  );

  // Load home data when user is available
  useEffect(() => {
    if (user) {
      console.log('Loading home data for user:', user.userId);
      loadHomeData(user.userId);
    }
  }, [loadHomeData, user]);

  const handleCompleteGoal = async (goalId: string) => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to complete daily directives.');
      return;
    }

    try {
      setCompletingGoalId(goalId);
      await completeDailyChallenge(user.userId, goalId);
    } catch (error) {
      console.error('Error completing directive:', error);
      Alert.alert('Could Not Complete', 'Please try again in a moment.');
    } finally {
      setCompletingGoalId(null);
    }
  };

  const handleCreateGoal = async (title: string, description?: string) => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to add custom targets.');
      return;
    }

    try {
      setCreatingGoal(true);
      await createCustomChallenge(user.userId, title, description);
    } catch (error) {
      console.error('Error creating directive:', error);
      Alert.alert('Could Not Add Target', 'Please check the title and try again.');
      throw error;
    } finally {
      setCreatingGoal(false);
    }
  };

  const handleGoalPress = (goal: DailyGoal) => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to start daily directives.');
      return;
    }

    const focusParams = getDirectiveFocusParams(goal);

    if (!focusParams) {
      void handleCompleteGoal(goal.id);
      return;
    }

    router.push({
      pathname: '/focus',
      params: focusParams,
    } as any);
  };

  // Show loading indicator
  if (loading && !userStats) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.textSecondary, marginTop: 12 }}>
          Loading your data...
        </Text>
      </View>
    );
  }
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            Sankalp <Text style={styles.accent}>OS</Text>
          </Text>
          <Text style={styles.headerSub}>Focus Protocol Active</Text>
        </View>
      </View>

      {/* ── Stats Grid: Coins, Level, Achievement ── */}
      <StatsGrid
        coins={userStats?.totalFocusPoints || 100}
        level={userStats?.currentLevel || 1}
        levelProgress={userStats?.levelProgress || 0}
        achievementLevel={userStats?.achievementLevel || 'Novice I'}
        achievementName={userStats?.achievementName || 'Beginner'}
      />

      {/* ── Streak Calendar ── */}
      <StreakCalendar
        month={currentMonth}
        marks={currentMonthMarks}
        currentStreak={streakInfo?.currentStreak || 0}
        bestStreak={streakInfo?.bestStreak || 0}
      />

      {/* ── Daily Directives ── */}
      <DailyGoalCard
        goals={dailyChallenges.length > 0
          ? dailyChallenges.map(challenge => ({
            id: challenge.id,
            title: challenge.title,
            description: challenge.description,
            type: challenge.type,
            reward: `+${challenge.rewardFP} FP`,
            progress: challenge.progress,
            total: challenge.total,
            unit: challenge.unit,
            completed: challenge.completed,
          }))
          : MOCK_GOALS
        }
        completingGoalId={completingGoalId}
        creatingGoal={creatingGoal}
        onCompleteGoal={handleCompleteGoal}
        onCreateGoal={handleCreateGoal}
        onGoalPress={handleGoalPress}
      />

      {/* ── Study History Banner ── */}
      <Pressable
        style={styles.historyBanner}
        onPress={() => router.push('/study-history' as any)}
      >
        <View style={styles.bannerLeft}>
          <View style={[styles.bannerIcon, styles.historyIcon]}>
            <BarChart3 size={20} color="#8b5cf6" />
          </View>
          <View>
            <Text style={styles.bannerTitle}>Study History</Text>
            <Text style={styles.bannerSub}>View your progress & stats</Text>
          </View>
        </View>
        <ChevronRight size={20} color={COLORS.border} />
      </Pressable>

      {/* ── Start Focus Banner ── */}
      <Pressable
        style={styles.focusBanner}
        onPress={() => router.push('/focus' as any)}
      >
        <View style={styles.bannerLeft}>
          <View style={styles.bannerIcon}>
            <Zap size={20} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.bannerTitle}>Initialize Session</Text>
            <Text style={styles.bannerSub}>Enter isolated focus mode</Text>
          </View>
        </View>
        <ChevronRight size={20} color={COLORS.border} />
      </Pressable>
    </ScrollView>
  );
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  accent: { color: COLORS.primary },
  headerSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  focusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 4,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(20,184,166,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  bannerSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  historyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 4,
  },
  historyIcon: {
    backgroundColor: 'rgba(139,92,246,0.12)',
  },
});
