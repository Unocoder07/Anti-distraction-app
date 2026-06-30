import { Flame } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/src/theme';
import type { ThemeColors } from '@/src/theme';

interface StreakCardProps {
  streak: number;
  bestStreak?: number;
  todayDone?: boolean;
  todayStudyMinutes?: number;
}

export function StreakCard({
  streak,
  bestStreak = 21,
  todayDone = false,
  todayStudyMinutes = 0,
}: StreakCardProps) {
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const studyTime = formatStudyTime(todayStudyMinutes);


  return (

    <View style={styles.card}>
      <View style={styles.mainRow}>
        <View style={[styles.iconWrap, todayDone && styles.iconWrapActive]}>
          <Flame
            size={22}
            color={todayDone ? '#f97316' : COLORS.textSecondary}
            fill={todayDone ? 'rgba(249,115,22,0.3)' : 'transparent'}
          />
        </View>

        <View style={styles.info}>
          <Text style={styles.streakValue}>
            {streak}
            <Text style={styles.unit}> days</Text>
          </Text>
          <Text style={styles.label}>Current Streak</Text>
        </View>

        <View style={[styles.todayBadge, todayDone && styles.todayBadgeDone]}>
          <Text style={[styles.todayText, todayDone && styles.todayTextDone]}>
            {todayDone ? 'Today done' : 'Today?'}
          </Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{bestStreak}</Text>
          <Text style={styles.metricLabel}>Best Streak</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metric}>
          <Text style={[styles.metricValue, styles.studyValue]}>{studyTime}</Text>
          <Text style={styles.metricLabel}>Studied Today</Text>
        </View>
      </View>
    </View>
  );
}

function formatStudyTime(minutes: number): string {
  const safeMinutes = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  if (hours > 0 && remainingMinutes > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${remainingMinutes}m`;
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
  card: {
    gap: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(249,115,22,0.12)',
  },
  info: {
    flex: 1,
  },
  streakValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  unit: {
    fontSize: 13,
    fontWeight: '400',
    color: COLORS.textSecondary,
  },
  label: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  studyValue: {
    color: COLORS.primary,
  },
  metricLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: COLORS.border,
  },
  todayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  todayBadgeDone: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderColor: 'rgba(34,197,94,0.3)',
  },
  todayText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  todayTextDone: {
    color: '#22c55e',
  },
});
