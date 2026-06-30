import { useTheme } from '@/src/theme';
import type { ThemeColors } from '@/src/theme';
import { RADIUS, SPACING } from '@/src/constants/spacing';
import {
  buildMonthGrid,
  computeStreaks,
  getIntensityLevel,
  indexMarks,
  isDayCompleted,
  type ProgressMark,
  summarizeMonth,
} from '@/src/utils/progressStats';
import { toLocalDateKey } from '@/src/utils/time';
import { CheckCircle2 } from 'lucide-react-native';
import { memo, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

interface StreakCalendarProps {
  month: Date;
  marks: ProgressMark[];
  currentStreak: number;
  bestStreak: number;
  showStreakStats?: boolean;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const formatMonthTitle = (date: Date) =>
  date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

function StreakCalendarBase({
  month,
  marks,
  currentStreak,
  bestStreak,
  showStreakStats = true,
}: StreakCalendarProps) {
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const grid = useMemo(() => buildMonthGrid(month), [month]);
  const todayKey = useMemo(() => toLocalDateKey(new Date()), []);
  const markMap = useMemo(() => indexMarks(marks), [marks]);
  const summary = useMemo(() => summarizeMonth(marks, month), [marks, month]);

  const pulseScale = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(withTiming(1.08, { duration: 800 }), withTiming(1, { duration: 800 })),
      -1,
      true,
    );

    return () => cancelAnimation(pulseScale);
  }, [pulseScale]);

  const todayStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseScale.value }] }));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.monthTitle}>{formatMonthTitle(month)}</Text>
          <View style={styles.rateWrap}>
            <CompletionRing percent={summary.completionRate} size={40} />
          </View>
        </View>
        {showStreakStats && (
          <View style={styles.streakRow}>
            <View style={styles.streakBadge}>
              <Text style={styles.streakLabel}>STREAK</Text>
              <Text style={styles.streakValue}>{currentStreak}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.streakBadge}>
              <Text style={styles.streakLabel}>BEST</Text>
              <Text style={styles.streakValueBest}>{bestStreak}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.streakBadge}>
              <Text style={styles.streakLabel}>ACTIVE</Text>
              <Text style={styles.streakValue}>{summary.activeDays}</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.weekHeader}>
        {WEEKDAYS.map((day, i) => (
          <Text key={`${day}-${i}`} style={styles.weekday}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {grid.map((cell) => {
          const mark = cell.dateKey ? markMap[cell.dateKey] : undefined;
          const intensity = getIntensityLevel(mark);
          const completed = isDayCompleted(mark);
          const isToday = cell.dateKey === todayKey;

          if (!cell.dayOfMonth) {
            return <View key={cell.key} style={styles.dayCell} />;
          }

          const DayWrapper = isToday ? Animated.View : View;
          const wrapperStyle = isToday ? [styles.dayCell, styles.todayCell, todayStyle] : styles.dayCell;

          return (
            <DayWrapper key={cell.key} style={wrapperStyle}>
              <Animated.View
                entering={FadeIn.delay(20)}
                style={[
                  styles.dayInner,
                  intensity === 1 && styles.intensity1,
                  intensity === 2 && styles.intensity2,
                  intensity === 3 && styles.intensity3,
                  intensity === 4 && styles.intensity4,
                  isToday && styles.todayInner,
                ]}
              >
                <Text style={[styles.dayText, completed && styles.dayTextCompleted]}>
                  {cell.dayOfMonth}
                </Text>
                {completed && (
                  <View style={styles.checkWrap}>
                    <CheckCircle2 size={12} color={COLORS.success} fill={COLORS.success} />
                  </View>
                )}
              </Animated.View>
            </DayWrapper>
          );
        })}
      </View>
    </View>
  );
}

function CompletionRing({ percent, size }: { percent: number; size: number }) {
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, percent));
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLORS.border}
          strokeWidth={3}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLORS.primary}
          strokeWidth={3}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.ringInner]}>
        <Text style={styles.ringText}>{progress}%</Text>
      </View>
    </View>
  );
}

export const StreakCalendar = memo(StreakCalendarBase);

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  header: { gap: SPACING.sm },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  rateWrap: { alignItems: 'center', justifyContent: 'center' },
  ringInner: { alignItems: 'center', justifyContent: 'center' },
  ringText: { fontSize: 10, fontWeight: '700', color: COLORS.primary },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  streakBadge: { flex: 1, alignItems: 'center', gap: 2 },
  streakLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  streakValue: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  streakValueBest: { fontSize: 20, fontWeight: '800', color: '#facc15' },
  divider: { width: 1, height: 24, backgroundColor: COLORS.border },
  weekHeader: { flexDirection: 'row', marginTop: SPACING.xs },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 2,
  },
  todayCell: {},
  dayInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: 'transparent',
    position: 'relative',
  },
  todayInner: {
    borderColor: '#facc15',
    borderWidth: 2,
  },
  intensity1: { backgroundColor: 'rgba(20,184,166,0.2)' },
  intensity2: { backgroundColor: 'rgba(20,184,166,0.4)' },
  intensity3: { backgroundColor: 'rgba(20,184,166,0.6)' },
  intensity4: { backgroundColor: 'rgba(20,184,166,0.85)' },
  dayText: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
  dayTextCompleted: { color: COLORS.text },
  checkWrap: {
    position: 'absolute',
    top: 1,
    right: 1,
  },
});
