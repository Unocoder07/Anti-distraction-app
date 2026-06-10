import { Flame } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants/colors';

interface StreakCardProps {
  streak: number;
  bestStreak?: number;
  todayDone?: boolean;
}

export function StreakCard({
  streak,
  bestStreak = 21,
  todayDone = false,
}: StreakCardProps) {
  return (
    <View style={styles.card}>
      {/* Flame icon */}
      <View style={[styles.iconWrap, todayDone && styles.iconWrapActive]}>
        <Flame
          size={22}
          color={todayDone ? '#f97316' : COLORS.textSecondary}
          fill={todayDone ? 'rgba(249,115,22,0.3)' : 'transparent'}
        />
      </View>

      {/* Stats */}
      <View style={styles.info}>
        <Text style={styles.streakValue}>
          {streak}
          <Text style={styles.unit}> days</Text>
        </Text>
        <Text style={styles.label}>Current Streak</Text>
      </View>

      {/* Best */}
      <View style={styles.best}>
        <Text style={styles.bestValue}>{bestStreak}</Text>
        <Text style={styles.bestLabel}>Best</Text>
      </View>

      {/* Today indicator */}
      <View style={[styles.todayBadge, todayDone && styles.todayBadgeDone]}>
        <Text style={[styles.todayText, todayDone && styles.todayTextDone]}>
          {todayDone ? '✓ Today' : 'Today?'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
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
  best: {
    alignItems: 'center',
    paddingHorizontal: 12,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
  },
  bestValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  bestLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
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
