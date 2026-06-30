import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Polyline, Stop } from 'react-native-svg';
import { COLORS } from '@/src/constants/colors';
import { useTheme } from '@/src/theme';
import type { ThemeColors } from '@/src/theme';

export interface TrendDataPoint {
  label: string;
  value: number;
}

interface FocusTrendProps {
  data: TrendDataPoint[];
  title?: string;
  subtitle?: string;
  /** Line + gradient color */
  color?: string;
  height?: number;
}

export function FocusTrend({
  data,
  title = 'Focus Flow',
  subtitle = 'Peak productivity times today',
  color = COLORS.primary,
  height = 100,
}: FocusTrendProps) {
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const CHART_W = 280;
  const CHART_H = height;
  const PADDING = 8;

  const maxVal = Math.max(...data.map((d) => d.value), 1);

  // Map data to SVG points
  const points = data.map((d, i) => {
    const x = PADDING + (i / (data.length - 1)) * (CHART_W - PADDING * 2);
    const y = PADDING + (1 - d.value / maxVal) * (CHART_H - PADDING * 2);
    return `${x},${y}`;
  });

  // Close path for gradient fill
  const firstX = PADDING;
  const lastX = PADDING + (CHART_W - PADDING * 2);
  const bottomY = CHART_H - PADDING;
  const fillPoints = [
    `${firstX},${bottomY}`,
    ...points,
    `${lastX},${bottomY}`,
  ].join(' ');

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {/* SVG line chart */}
      <View style={styles.chartWrap}>
        <Svg width="100%" height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
          <Defs>
            <LinearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <Stop offset="100%" stopColor={color} stopOpacity={0} />
            </LinearGradient>
          </Defs>

          {/* Gradient fill */}
          <Polyline
            points={fillPoints}
            fill="url(#trendGrad)"
            stroke="none"
          />

          {/* Line */}
          <Polyline
            points={points.join(' ')}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </Svg>

        {/* X-axis labels */}
        <View style={styles.xAxis}>
          {data.map((d) => (
            <Text key={d.label} style={styles.xLabel}>
              {d.label}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },
  header: {
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  chartWrap: {
    gap: 4,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  xLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
