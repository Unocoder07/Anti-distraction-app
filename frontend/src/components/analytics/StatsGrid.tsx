import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants/colors';

export interface StatItem {
  icon: React.ReactNode;
  label: string;
  value: string;
  /** Optional sub-label, e.g. "3 failed" */
  sub?: string;
  /** Optional accent color for the value */
  valueColor?: string;
}

interface StatsGridProps {
  stats: StatItem[];
  /** Number of columns — defaults to 2 */
  columns?: 2 | 3 | 4;
}

export function StatsGrid({ stats, columns = 2 }: StatsGridProps) {
  // Split into rows of `columns`
  const rows: StatItem[][] = [];
  for (let i = 0; i < stats.length; i += columns) {
    rows.push(stats.slice(i, i + columns));
  }

  return (
    <View style={styles.container}>
      {rows.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((stat, si) => (
            <StatCard key={si} stat={stat} />
          ))}
          {/* Fill empty slots in last row */}
          {row.length < columns &&
            Array.from({ length: columns - row.length }).map((_, ei) => (
              <View key={`empty-${ei}`} style={styles.emptySlot} />
            ))}
        </View>
      ))}
    </View>
  );
}

function StatCard({ stat }: { stat: StatItem }) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>{stat.icon}</View>
      <Text style={styles.label}>{stat.label}</Text>
      <Text style={[styles.value, stat.valueColor ? { color: stat.valueColor } : null]}>
        {stat.value}
      </Text>
      {stat.sub ? <Text style={styles.sub}>{stat.sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  emptySlot: {
    flex: 1,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  sub: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
});
