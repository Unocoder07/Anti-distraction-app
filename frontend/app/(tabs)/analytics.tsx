// Route: "/analytics" -> Analytics
import { StreakCalendar } from '@/src/components/calendar/StreakCalendar';
import { FocusTrend } from '@/src/components/analytics/FocusTrend';
import { StatsGrid } from '@/src/components/analytics/StatsGrid';
import { WeeklyChart } from '@/src/components/analytics/WeeklyChart';
import { analyticsService, type AnalyticsOverview } from '@/src/services/analyticsService';
import { useAuthStore, useHomeStore } from '@/src/store';
import { useTheme } from '@/src/theme';
import type { ThemeColors } from '@/src/theme';
import { toLocalMonthKey } from '@/src/utils/time';
import { computeStreaks } from '@/src/utils/progressStats';
import { router } from 'expo-router';
import { BookOpen, Brain, ChevronRight, Target } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const HISTORY_MONTH_COUNT = 3;

const getPreviousMonths = (count: number) => {
  const current = new Date();

  return Array.from({ length: count }, (_, index) => {
    const month = new Date(current.getFullYear(), current.getMonth() - index - 1, 1);
    return {
      date: month,
      key: toLocalMonthKey(month),
    };
  });
};

export default function AnalyticsScreen() {
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const { user } = useAuthStore();
  const { progressMarks, loadProgressCalendar } = useHomeStore();
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [data] = await Promise.all([
        analyticsService.getAnalyticsOverview(user.userId),
        loadProgressCalendar(user.userId),
      ]);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [loadProgressCalendar, user]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadAnalytics();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadAnalytics]);

  const historyMonths = useMemo(() => getPreviousMonths(HISTORY_MONTH_COUNT), []);
  const monthlyHistory = useMemo(
    () =>
      historyMonths.map((month) => ({
        ...month,
        marks: progressMarks.filter((mark) => mark.date.startsWith(month.key)),
      })),
    [historyMonths, progressMarks],
  );

  const streaks = useMemo(() => computeStreaks(progressMarks), [progressMarks]);

  if (loading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <Text style={styles.emptyTitle}>No data yet.</Text>
        <Text style={styles.emptySub}>Complete a session to start building your history.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>Progress history and productivity trends</Text>
      </View>

      <StatsGrid
        stats={[
          {
            icon: <Brain size={18} color={COLORS.primary} />,
            label: 'Deep Work',
            value: `${analytics.weeklyDeepWorkHours?.toFixed(1) || 0}h`,
          },
          {
            icon: <Target size={18} color="#a78bfa" />,
            label: 'Sessions',
            value: `${analytics.totalSessions || 0}`,
          },
        ]}
        columns={2}
      />

      <View style={styles.historySection}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Calendar History</Text>
            <Text style={styles.sectionSub}>Previous months only</Text>
          </View>
          <Pressable
            style={styles.historyButton}
            onPress={() => router.push('/study-history' as any)}
          >
            <BookOpen size={16} color={COLORS.primary} />
            <ChevronRight size={16} color={COLORS.textSecondary} />
          </Pressable>
        </View>

        {monthlyHistory.map((month) => (
          <StreakCalendar
            key={month.key}
            month={month.date}
            marks={month.marks}
            currentStreak={streaks.currentStreak}
            bestStreak={streaks.bestStreak}
            showStreakStats={false}
          />
        ))}
      </View>

      <WeeklyChart
        data={analytics.weeklyChart || []}
        title="Focus Time"
        todayIndex={new Date().getDay() === 0 ? 6 : new Date().getDay() - 1}
      />

      <FocusTrend
        data={analytics.trendChart || []}
        title="Focus Flow"
        subtitle="Peak productivity times"
        color={COLORS.primary}
        height={110}
      />
    </ScrollView>
  );
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  container: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  header: { gap: 4, marginBottom: 4 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: { fontSize: 12, color: COLORS.textSecondary },
  historySection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  sectionSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  historyButton: {
    minWidth: 48,
    minHeight: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
});
