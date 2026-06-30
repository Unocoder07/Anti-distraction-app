import { useMemo } from 'react';
import { Clock, Flame, Target, Trophy } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/src/theme';
import type { ThemeColors } from '@/src/theme';

export interface SessionStatsData {
  /** Elapsed seconds in current session */
  elapsedSeconds: number;
  /** Number of completed pomodoro cycles */
  cyclesCompleted: number;
  /** Total cycles planned for this session */
  totalCycles: number;
  /** Focus coins earned this session */
  coinsEarned: number;
  /** Current streak in days */
  streak: number;
}

interface SessionStatsProps {
  stats: SessionStatsData;
}

export function SessionStats({ stats }: SessionStatsProps) {
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const elapsedMins = Math.floor(stats.elapsedSeconds / 60);
  const elapsedSecs = stats.elapsedSeconds % 60;
  const elapsedLabel =
    elapsedMins > 0
      ? `${elapsedMins}m ${String(elapsedSecs).padStart(2, '0')}s`
      : `${elapsedSecs}s`;

  return (
    <View style={styles.grid}>
      <StatTile
        icon={<Clock size={16} color={COLORS.primary} />}
        label="Elapsed"
        value={elapsedLabel}
      />
      <StatTile
        icon={<Target size={16} color="#a78bfa" />}
        label="Sessions"
        value={`${stats.cyclesCompleted}`}
      />
      <StatTile
        icon={<Trophy size={16} color="#facc15" />}
        label="FC Earned"
        value={`+${stats.coinsEarned}`}
        valueColor="#facc15"
      />
      <StatTile
        icon={<Flame size={16} color="#f97316" />}
        label="Streak"
        value={`${stats.streak}d`}
        valueColor="#f97316"
      />
    </View>
  );
}

// ─── StatTile ────────────────────────────────────────────────────────────────

interface StatTileProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
}

function StatTile({ icon, label, value, valueColor }: StatTileProps) {
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  return (
    <View style={styles.tile}>
      <View style={styles.tileIcon}>{icon}</View>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={[styles.tileValue, valueColor ? { color: valueColor } : null]}>
        {value}
      </Text>
    </View>
  );
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: 10,
  },
  tile: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
  },
  tileIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '500',
  },
  tileValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
});
