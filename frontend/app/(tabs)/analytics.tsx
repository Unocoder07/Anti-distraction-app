// Route: "/analytics" → Analytics
import { FocusTrend } from '@/src/components/analytics/FocusTrend';
import { StatsGrid } from '@/src/components/analytics/StatsGrid';
import { WeeklyChart } from '@/src/components/analytics/WeeklyChart';
import { COLORS } from '@/src/constants/colors';
import { analyticsService } from '@/src/services/analyticsService';
import { useAuthStore } from '@/src/store';
import { router } from 'expo-router';
import { Activity, BookOpen, Brain, ChevronRight, Target, TrendingUp } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function AnalyticsScreen() {
  const { user } = useAuthStore();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [user]);

  const loadAnalytics = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await analyticsService.getAnalyticsOverview(user.userId);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.textSecondary, marginTop: 12 }}>
          Loading analytics...
        </Text>
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: COLORS.text, fontSize: 16 }}>
          No data yet. Complete some sessions!
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
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>Performance metrics & trends</Text>
      </View>

      {/* ── Weekly Focus Score ── */}
      <View style={styles.scoreCard}>
        <View style={[styles.scoreBgIcon, { pointerEvents: 'none' }]}>
          <Activity size={96} color={COLORS.primary} />
        </View>
        <Text style={styles.scoreLabel}>Weekly Focus Score</Text>
        <View style={styles.scoreRow}>
          <Text style={styles.scoreValue}>{analytics.weeklyFocusScore || 0}</Text>
          <Text style={styles.scoreMax}> / 100</Text>
        </View>
        <View style={styles.scoreChange}>
          <TrendingUp size={12} color={COLORS.success} />
          <Text style={styles.scoreChangeText}>
            {analytics.weeklySessionCount || 0} sessions this week
          </Text>
        </View>
      </View>

      {/* ── Stats Grid ── */}
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
          {
            icon: <Activity size={18} color="#facc15" />,
            label: 'Focus Score',
            value: `${analytics.weeklyFocusScore || 0}`,
            valueColor: '#facc15',
          },
          {
            icon: <TrendingUp size={18} color={COLORS.success} />,
            label: 'Streak',
            value: `${analytics.currentStreak || 0} days`,
            valueColor: COLORS.success,
          },
        ]}
        columns={2}
      />

      {/* ── Study History Link ── */}
      <Pressable
        style={styles.historyLink}
        onPress={() => router.push('/study-history' as any)}
      >
        <View style={styles.historyLeft}>
          <BookOpen size={20} color={COLORS.primary} />
          <View>
            <Text style={styles.historyTitle}>Subject-wise History</Text>
            <Text style={styles.historySub}>View detailed study records</Text>
          </View>
        </View>
        <ChevronRight size={20} color={COLORS.border} />
      </Pressable>

      {/* ── Weekly Bar Chart ── */}
      <WeeklyChart
        data={analytics.weeklyChart || []}
        title="Focus Time"
        todayIndex={new Date().getDay() === 0 ? 6 : new Date().getDay() - 1}
      />

      {/* ── Focus Flow Trend ── */}
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
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
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 12, color: COLORS.textSecondary },

  // Score card
  scoreCard: {
    backgroundColor: 'rgba(19,78,74,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.3)',
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  scoreBgIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    opacity: 0.08,
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'flex-end' },
  scoreValue: { fontSize: 52, fontWeight: '300', color: COLORS.text },
  scoreMax: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 10 },
  scoreChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  scoreChangeText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '500',
  },
  historyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  historySub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
