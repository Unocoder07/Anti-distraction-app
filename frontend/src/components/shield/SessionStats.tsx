/**
 * SessionStats - Display Coins, Time, Status
 */

import { RADIUS, SPACING } from '@/src/constants/spacing';
import { useTheme } from '@/src/theme';
import type { ThemeColors } from '@/src/theme';
import { Clock, Coins, Shield } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface SessionStatsProps {
  timeRemaining: number; // seconds
  appsBlocked: number;
  status: 'active' | 'safe_mode';
  rewardCoins: number;
}

export function SessionStats({ timeRemaining, appsBlocked, status, rewardCoins }: SessionStatsProps) {
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const statusText = status === 'safe_mode'
    ? 'Safe Mode'
    : `${appsBlocked} active`;
  const statusColor = status === 'safe_mode' ? '#f59e0b' : COLORS.primary;

  return (
    <View style={styles.container}>
      {/* Time Remaining */}
      <View style={styles.stat}>
        <View style={[styles.iconBox, { backgroundColor: `${COLORS.primary}15` }]}>
          <Clock size={16} color={COLORS.primary} />
        </View>
        <View style={styles.statContent}>
          <Text style={styles.statLabel}>Time Left</Text>
          <Text style={styles.statValue}>{timeDisplay}</Text>
        </View>
      </View>

      {/* Apps Blocked */}
      <View style={styles.stat}>
        <View style={[styles.iconBox, { backgroundColor: `${statusColor}15` }]}>
          <Shield size={16} color={statusColor} />
        </View>
        <View style={styles.statContent}>
          <Text style={styles.statLabel}>Status</Text>
          <Text style={[styles.statValue, { color: statusColor }]}>{statusText}</Text>
        </View>
      </View>

      {/* Reward Preview */}
      <View style={styles.stat}>
        <View style={[styles.iconBox, { backgroundColor: `${COLORS.warning}15` }]}>
          <Coins size={16} color={COLORS.warning} />
        </View>
        <View style={styles.statContent}>
          <Text style={styles.statLabel}>On Completion</Text>
          <Text style={[styles.statValue, { color: COLORS.warning }]}>+{rewardCoins} coins</Text>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },

  stat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
  },

  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statContent: {
    flex: 1,
    gap: 2,
  },

  statLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
});
