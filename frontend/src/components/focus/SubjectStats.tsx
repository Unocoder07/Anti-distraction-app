import { useMemo } from 'react';
import type { SubjectStudyData } from '@/src/types';
import { Clock, TrendingUp } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/src/theme';
import type { ThemeColors } from '@/src/theme';
import { RADIUS, SPACING } from '../../constants/spacing';

interface SubjectStatsProps {
  subjectData: Record<string, SubjectStudyData>;
}

export function SubjectStats({ subjectData }: SubjectStatsProps) {
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const subjects = Object.values(subjectData).sort(
    (a, b) => b.totalFocusTime - a.totalFocusTime
  );

  if (subjects.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No study data yet</Text>
        <Text style={styles.emptyHint}>Start a focus session to track your progress</Text>
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Study Statistics</Text>
      {subjects.map((subject) => (
        <View key={subject.subjectId} style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.subjectName}>{subject.subjectName}</Text>
          </View>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Clock size={16} color={COLORS.primary} />
              <Text style={styles.statValue}>{formatTime(subject.totalFocusTime)}</Text>
              <Text style={styles.statLabel}>Total Time</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <TrendingUp size={16} color={COLORS.primary} />
              <Text style={styles.statValue}>{subject.totalSessions}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  emptyHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
