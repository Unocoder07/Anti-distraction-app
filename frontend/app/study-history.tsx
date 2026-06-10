// Route: "/study-history" → Study History Screen
import { COLORS } from '@/src/constants/colors';
import { RADIUS, SPACING } from '@/src/constants/spacing';
import { focusService } from '@/src/services/focusService';
import { useAuthStore } from '@/src/store/authStore';
import type { SubjectStudyData } from '@/src/types';
import { router } from 'expo-router';
import { ArrowLeft, BookOpen, ChevronRight, Clock, TrendingUp } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function StudyHistoryScreen() {
  const { user } = useAuthStore();
  const [subjects, setSubjects] = useState<SubjectStudyData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await focusService.getSubjectStudyData(user.userId);
      const mapped: SubjectStudyData[] = data.map((s) => ({
        subjectId: s.subjectId,
        subjectName: s.subjectName,
        totalSessions: s.totalSessions,
        totalFocusTime: s.totalMinutes * 60,
        lastStudied: s.lastStudied?.getTime(),
        sessionsHistory: [],
      }));
      setSubjects(mapped.sort((a, b) => b.totalFocusTime - a.totalFocusTime));
    } catch (error) {
      console.error('Error loading study history:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
