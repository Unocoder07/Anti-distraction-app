// Route: "/subject-detail" → Subject Detail Screen with Session History
import { RADIUS, SPACING } from '@/src/constants/spacing';
import { focusService } from '@/src/services/focusService';
import { useAuthStore } from '@/src/store/authStore';
import { useTheme } from '@/src/theme';
import type { ThemeColors } from '@/src/theme';
import type { FocusSession, SubjectStudyData } from '@/src/types';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Calendar, Clock, Coins, Trash2, TrendingUp, Zap } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function SubjectDetailScreen() {
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const params = useLocalSearchParams();
  const subjectId = params.subjectId as string;
  const subjectName = params.subjectName as string;
  const { user } = useAuthStore();
  const [subjectData, setSubjectData] = useState<SubjectStudyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user || !subjectId) return;
    setLoading(true);
    try {
      const [studyData, sessions] = await Promise.all([
        focusService.getSubjectStudyData(user.userId),
        focusService.getUserSessions(user.userId, 100),
      ]);

      const subjectStats = studyData.find((s) => s.subjectId === subjectId);
      const subjectSessions = sessions.filter(
        (s) => s.subjectId === subjectId || s.subject === subjectName
      );

      const mappedSessions: FocusSession[] = subjectSessions.map((s) => ({
        id: s.id,
        startTime: s.startTime.getTime(),
        endTime: s.endTime?.getTime(),
        duration: (s.actualDuration || s.duration) * 60,
        cyclesCompleted: s.cyclesCompleted,
        totalCycles: s.cycles,
        coinsEarned: s.focusPointsEarned,
        status: s.status === 'completed' ? 'completed' : s.status === 'broken' ? 'failed' : 'active',
        interruptions: s.distractionCount,
        subjectId: s.subjectId,
        subjectName: s.subject,
      }));

      const totalFocusTime = subjectStats
        ? subjectStats.totalMinutes * 60
        : mappedSessions.reduce((sum, s) => sum + s.duration, 0);

      setSubjectData({
        subjectId,
        subjectName: subjectStats?.subjectName || subjectName || 'Subject',
        totalSessions: subjectStats?.totalSessions || mappedSessions.length,
        totalFocusTime,
        lastStudied: subjectStats?.lastStudied?.getTime(),
        sessionsHistory: mappedSessions,
      });
    } catch (error) {
      console.error('Error loading subject detail:', error);
    } finally {
      setLoading(false);
    }
  }, [user, subjectId, subjectName]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadData();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadData]);

  const handleDeleteSession = (session: FocusSession) => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to remove this session from your history? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(session.id);
              await focusService.deleteSession(session.id);
              setSubjectData((prev) =>
                prev
                  ? {
                      ...prev,
                      sessionsHistory: (prev.sessionsHistory || []).filter((s) => s.id !== session.id),
                      totalSessions: Math.max(0, prev.totalSessions - 1),
                      totalFocusTime: Math.max(0, prev.totalFocusTime - session.duration),
                    }
                  : prev,
              );
            } catch (error: any) {
              Alert.alert('Delete Failed', error?.message || 'Please try again.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!subjectData) {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={20} color={COLORS.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Subject Details</Text>
          <View style={styles.spacer} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Subject not found</Text>
        </View>
      </View>
    );
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';

    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined 
    });
  };

  const formatTime12Hour = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const sessions = [...(subjectData.sessionsHistory || [])].reverse(); // Most recent first
  const avgSessionTime = subjectData.totalSessions > 0 
    ? Math.floor(subjectData.totalFocusTime / subjectData.totalSessions) 
    : 0;
  const totalCoins = sessions.reduce((sum, s) => sum + s.coinsEarned, 0);

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{subjectData.subjectName}</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Overall Statistics</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <View style={styles.summaryIconBox}>
                <Clock size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.summaryValue}>{formatTime(subjectData.totalFocusTime)}</Text>
              <Text style={styles.summaryLabel}>Total Time</Text>
            </View>
            <View style={styles.summaryItem}>
              <View style={styles.summaryIconBox}>
                <Zap size={20} color="#facc15" />
              </View>
              <Text style={styles.summaryValue}>{subjectData.totalSessions}</Text>
              <Text style={styles.summaryLabel}>Sessions</Text>
            </View>
            <View style={styles.summaryItem}>
              <View style={styles.summaryIconBox}>
                <TrendingUp size={20} color="#10b981" />
              </View>
              <Text style={styles.summaryValue}>{formatTime(avgSessionTime)}</Text>
              <Text style={styles.summaryLabel}>Avg Session</Text>
            </View>
            <View style={styles.summaryItem}>
              <View style={styles.summaryIconBox}>
                <Coins size={20} color="#f59e0b" />
              </View>
              <Text style={styles.summaryValue}>{totalCoins}</Text>
              <Text style={styles.summaryLabel}>Total Coins</Text>
            </View>
          </View>
        </View>

        {/* Session History */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Session History</Text>
          <Text style={styles.sectionSubtitle}>
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} completed
          </Text>
        </View>

        {sessions.length === 0 ? (
          <View style={styles.emptySessionsContainer}>
            <Text style={styles.emptySessionsText}>No sessions yet</Text>
          </View>
        ) : (
          sessions.map((session, index) => (
            <View key={session.id} style={styles.sessionCard}>
              {/* Session Header */}
              <View style={styles.sessionHeader}>
                <View style={styles.sessionNumber}>
                  <Text style={styles.sessionNumberText}>#{sessions.length - index}</Text>
                </View>
                <View style={styles.sessionHeaderInfo}>
                  <View style={styles.sessionDateRow}>
                    <Calendar size={14} color={COLORS.primary} />
                    <Text style={styles.sessionDate}>{formatDate(session.startTime)}</Text>
                  </View>
                  <Text style={styles.sessionTime}>
                    {formatTime12Hour(session.startTime)}
                    {session.endTime && ` - ${formatTime12Hour(session.endTime)}`}
                  </Text>
                </View>
                <View style={[
                  styles.sessionStatus,
                  session.status === 'completed' && styles.sessionStatusCompleted,
                  session.status === 'failed' && styles.sessionStatusFailed,
                ]}>
                  <Text style={[
                    styles.sessionStatusText,
                    session.status === 'completed' && styles.sessionStatusTextCompleted,
                    session.status === 'failed' && styles.sessionStatusTextFailed,
                  ]}>
                    {session.status === 'completed' ? '✓' : '✗'}
                  </Text>
                </View>
                <Pressable
                  style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.6 }]}
                  hitSlop={8}
                  disabled={deletingId === session.id}
                  onPress={() => handleDeleteSession(session)}
                >
                  {deletingId === session.id ? (
                    <ActivityIndicator size="small" color={COLORS.danger} />
                  ) : (
                    <Trash2 size={16} color={COLORS.danger} />
                  )}
                </Pressable>
              </View>

              {/* Session Stats */}
              <View style={styles.sessionStats}>
                <View style={styles.sessionStat}>
                  <Clock size={16} color={COLORS.textSecondary} />
                  <Text style={styles.sessionStatLabel}>Duration</Text>
                  <Text style={styles.sessionStatValue}>{formatTime(session.duration)}</Text>
                </View>
                <View style={styles.sessionDivider} />
                <View style={styles.sessionStat}>
                  <Zap size={16} color={COLORS.textSecondary} />
                  <Text style={styles.sessionStatLabel}>Cycles</Text>
                  <Text style={styles.sessionStatValue}>
                    {session.cyclesCompleted}/{session.totalCycles}
                  </Text>
                </View>
                <View style={styles.sessionDivider} />
                <View style={styles.sessionStat}>
                  <Coins size={16} color="#f59e0b" />
                  <Text style={styles.sessionStatLabel}>Earned</Text>
                  <Text style={[styles.sessionStatValue, { color: '#f59e0b' }]}>
                    {session.coinsEarned} FC
                  </Text>
                </View>
              </View>

              {/* Interruptions */}
              {session.interruptions > 0 && (
                <View style={styles.interruptionBadge}>
                  <Text style={styles.interruptionText}>
                    ⚠️ {session.interruptions} interruption{session.interruptions !== 1 ? 's' : ''}
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
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
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  summaryItem: {
    width: '47%',
    alignItems: 'center',
    gap: 8,
  },
  summaryIconBox: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  summaryLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  historySection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sessionCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  sessionNumber: {
    width: 36,
    height: 36,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  sessionHeaderInfo: {
    flex: 1,
  },
  sessionDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionDate: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  sessionTime: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sessionStatus: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sessionStatusCompleted: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderColor: '#10b981',
  },
  sessionStatusFailed: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: '#ef4444',
  },
  sessionStatusText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  sessionStatusTextCompleted: {
    color: '#10b981',
  },
  sessionStatusTextFailed: {
    color: '#ef4444',
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  sessionStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
  },
  sessionStat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  sessionStatLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sessionStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  sessionDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  interruptionBadge: {
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: RADIUS.sm,
    padding: SPACING.xs,
    alignItems: 'center',
  },
  interruptionText: {
    fontSize: 11,
    color: '#f59e0b',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  emptySessionsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
  },
  emptySessionsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
