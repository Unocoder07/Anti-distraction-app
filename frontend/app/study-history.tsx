// Route: "/study-history" → Study History Screen
import { RADIUS, SPACING } from '@/src/constants/spacing';
import { focusService } from '@/src/services/focusService';
import { useAuthStore } from '@/src/store/authStore';
import { useTheme } from '@/src/theme';
import type { ThemeColors } from '@/src/theme';
import type { FocusSession, SubjectStudyData } from '@/src/types';
import { router } from 'expo-router';
import { ArrowLeft, BookOpen, ChevronRight, Clock, Coins, Trash2, TrendingUp, Zap } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function StudyHistoryScreen() {
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const { user } = useAuthStore();
  const [subjects, setSubjects] = useState<SubjectStudyData[]>([]);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [data, userSessions] = await Promise.all([
        focusService.getSubjectStudyData(user.userId),
        focusService.getUserSessions(user.userId, 50),
      ]);
      const mapped: SubjectStudyData[] = data.map((s) => ({
        subjectId: s.subjectId,
        subjectName: s.subjectName,
        totalSessions: s.totalSessions,
        totalFocusTime: s.totalMinutes * 60,
        lastStudied: s.lastStudied?.getTime(),
        sessionsHistory: [],
      }));
      setSubjects(mapped.sort((a, b) => b.totalFocusTime - a.totalFocusTime));

      const mappedSessions: FocusSession[] = userSessions.map((s) => ({
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
      setSessions(mappedSessions);
    } catch (error) {
      console.error('Error loading study history:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

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
              setSessions((prev) => prev.filter((s) => s.id !== session.id));
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

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const formatTime12Hour = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const totalStudyTime = subjects.reduce((sum, s) => sum + s.totalFocusTime, 0);
  const totalSessions = subjects.reduce((sum, s) => sum + s.totalSessions, 0);

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
        <Text style={styles.headerTitle}>Study History</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Overall Stats */}
        <View style={styles.overallCard}>
          <Text style={styles.overallTitle}>Overall Progress</Text>
          <View style={styles.overallStats}>
            <View style={styles.overallStat}>
              <Clock size={24} color={COLORS.primary} />
              <Text style={styles.overallValue}>{formatTime(totalStudyTime)}</Text>
              <Text style={styles.overallLabel}>Total Time</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.overallStat}>
              <BookOpen size={24} color={COLORS.primary} />
              <Text style={styles.overallValue}>{totalSessions}</Text>
              <Text style={styles.overallLabel}>Sessions</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.overallStat}>
              <TrendingUp size={24} color={COLORS.primary} />
              <Text style={styles.overallValue}>{subjects.length}</Text>
              <Text style={styles.overallLabel}>Subjects</Text>
            </View>
          </View>
        </View>

        {/* Subject List */}
        <Text style={styles.sectionTitle}>By Subject</Text>

        {subjects.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No study sessions yet. Start a focus session!</Text>
          </View>
        ) : (
          subjects.map((subject) => (
            <Pressable
              key={subject.subjectId}
              style={({ pressed }) => [styles.subjectCard, pressed && { opacity: 0.7 }]}
              onPress={() =>
                router.push({
                  pathname: '/subject-detail' as any,
                  params: { subjectId: subject.subjectId, subjectName: subject.subjectName },
                })
              }
            >
              <View style={styles.subjectLeft}>
                <View style={styles.subjectIconBox}>
                  <BookOpen size={20} color={COLORS.primary} />
                </View>
                <View style={styles.subjectInfo}>
                  <Text style={styles.subjectName}>{subject.subjectName}</Text>
                  <Text style={styles.subjectMeta}>
                    {subject.totalSessions} sessions · {formatDate(subject.lastStudied)}
                  </Text>
                </View>
              </View>
              <View style={styles.subjectRight}>
                <Text style={styles.subjectTime}>{formatTime(subject.totalFocusTime)}</Text>
                <ChevronRight size={18} color={COLORS.border} />
              </View>
            </Pressable>
          ))
        )}

        {/* Recent Sessions */}
        <Text style={[styles.sectionTitle, { marginTop: SPACING.xl }]}>Recent Sessions</Text>
        
        {sessions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No recent sessions to display.</Text>
          </View>
        ) : (
          sessions.map((session, index) => (
            <View key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <View style={styles.sessionNumber}>
                  <Text style={styles.sessionNumberText}>#{sessions.length - index}</Text>
                </View>
                <View style={styles.sessionHeaderInfo}>
                  <View style={styles.sessionDateRow}>
                    <BookOpen size={14} color={COLORS.primary} />
                    <Text style={styles.sessionDate}>{session.subjectName || 'Subject'}</Text>
                  </View>
                  <Text style={styles.sessionTime}>
                    {formatDate(session.startTime)} · {formatTime12Hour(session.startTime)}
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

              <View style={styles.sessionStatsContainer}>
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
    paddingBottom: 32,
    gap: 16,
  },
  overallCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  overallTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  overallStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overallStat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  overallValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  overallLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  subjectLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  subjectIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectInfo: {
    flex: 1,
    gap: 2,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  subjectMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  subjectRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subjectTime: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
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
  sessionStatsContainer: {
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
});
