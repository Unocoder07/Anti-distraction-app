import { useTheme } from '@/src/theme';
import type { ThemeColors } from '@/src/theme';
import { RADIUS, SPACING } from '@/src/constants/spacing';
import {
  buildMonthGrid,
  getIntensityLevel,
  indexMarks,
  type ProgressMark,
  summarizeMonth,
} from '@/src/utils/progressStats';
import { toLocalDateKey } from '@/src/utils/time';
import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface MiniMonthCalendarProps {
  month: Date;
  marks: ProgressMark[];
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const formatMonthTitle = (date: Date) =>
  date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });

function MiniMonthCalendarBase({ month, marks }: MiniMonthCalendarProps) {
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const grid = useMemo(() => buildMonthGrid(month), [month]);
  const todayKey = useMemo(() => toLocalDateKey(new Date()), []);
  const markMap = useMemo(() => indexMarks(marks), [marks]);
  const summary = useMemo(() => summarizeMonth(marks, month), [marks, month]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.monthTitle}>{formatMonthTitle(month)}</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statValue}>{summary.activeDays}</Text>
          <Text style={styles.statLabel}>active</Text>
          <View style={styles.dot} />
          <Text style={styles.statValue}>{summary.completionRate}%</Text>
        </View>
      </View>

      <View style={styles.weekHeader}>
        {WEEKDAYS.map((d, i) => (
          <Text key={i} style={styles.weekday}>
            {d}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {grid.map((cell) => {
          const mark = cell.dateKey ? markMap[cell.dateKey] : undefined;
          const intensity = getIntensityLevel(mark);
          const isToday = cell.dateKey === todayKey;

          return (
            <View key={cell.key} style={styles.dayCell}>
              {cell.dayOfMonth ? (
                <View
                  style={[
                    styles.dayDot,
                    intensity === 1 && styles.intensity1,
                    intensity === 2 && styles.intensity2,
                    intensity === 3 && styles.intensity3,
                    intensity === 4 && styles.intensity4,
                    isToday && styles.todayDot,
                  ]}
                />
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

export const MiniMonthCalendar = memo(MiniMonthCalendarBase);

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statValue: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  statLabel: { fontSize: 10, color: COLORS.textSecondary },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: 2,
  },
  weekHeader: { flexDirection: 'row' },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.card,
  },
  todayDot: {
    borderWidth: 1,
    borderColor: '#facc15',
  },
  intensity1: { backgroundColor: 'rgba(20,184,166,0.25)' },
  intensity2: { backgroundColor: 'rgba(20,184,166,0.45)' },
  intensity3: { backgroundColor: 'rgba(20,184,166,0.65)' },
  intensity4: { backgroundColor: 'rgba(20,184,166,0.9)' },
});
