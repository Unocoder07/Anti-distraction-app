import { Calendar } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants/colors';

export interface WeeklyDataPoint {
  day: string;
  hours: number;
}

interface WeeklyChartProps {
  data: WeeklyDataPoint[];
  /** Max hours for scaling — defaults to highest value in data */
  maxHours?: number;
  title?: string;
  /** Bar color */
  barColor?: string;
  /** Highlight today's bar */
  todayIndex?: number;
}

export function WeeklyChart({
  data,
  maxHours,
  title = 'Focus Time',
  barColor = COLORS.primary,
  todayIndex,
}: WeeklyChartProps) {
  const max = maxHours ?? Math.max(...data.map((d) => d.hours), 1);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.badge}>
          <Calendar size={12} color={COLORS.textSecondary} />
          <Text style={styles.badgeText}>This Week</Text>
        </View>
      </View>

      {/* Y-axis labels + bars */}
      <View style={styles.chartArea}>
        {/* Y labels */}
        <View style={styles.yAxis}>
          {[max, Math.round(max / 2), 0].map((v) => (
            <Text key={v} style={styles.yLabel}>
              {v}h
            </Text>
          ))}
        </View>

        {/* Bars */}
        <View style={styles.bars}>
          {data.map((d, i) => {
            const isToday = todayIndex !== undefined && i === todayIndex;
            const fillPct = max > 0 ? (d.hours / max) * 100 : 0;

            return (
              <View key={d.day} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${fillPct}%` as any,
                        backgroundColor: isToday ? '#facc15' : barColor,
                        opacity: isToday ? 1 : 0.85,
                      },
                    ]}
                  />
                </View>
                {/* Value tooltip on hover — static label for top bar */}
                <Text style={styles.barValue}>
                  {d.hours > 0 ? `${d.hours}h` : ''}
                </Text>
                <Text style={[styles.barDay, isToday && styles.barDayToday]}>
                  {d.day}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* X-axis baseline */}
      <View style={styles.baseline} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.card,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  chartArea: {
    flexDirection: 'row',
    height: 140,
    gap: 8,
  },
  yAxis: {
    justifyContent: 'space-between',
    paddingBottom: 20,
    width: 24,
  },
  yLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  bars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    paddingBottom: 20,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    gap: 2,
  },
  barTrack: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  barValue: {
    fontSize: 8,
    color: COLORS.textSecondary,
    height: 10,
  },
  barDay: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  barDayToday: {
    color: '#facc15',
    fontWeight: '700',
  },
  baseline: {
    height: 1,
    backgroundColor: COLORS.card,
    marginTop: -16,
  },
});
