import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/src/theme';
import type { ThemeColors } from '@/src/theme';

interface CycleIndicatorProps {
  completed: number;
  total: number;
}

export function CycleIndicator({ completed, total }: CycleIndicatorProps) {
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  if (total <= 1) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Cycles</Text>
      <View style={styles.dots}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < completed && styles.dotCompleted,
              i === completed && styles.dotActive,
            ]}
          >
            {i < completed && <Text style={styles.check}>✓</Text>}
          </View>
        ))}
      </View>
      <Text style={styles.count}>
        {completed}/{total}
      </Text>
    </View>
  );
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCompleted: {
    backgroundColor: `${COLORS.primary}25`,
    borderColor: COLORS.primary,
  },
  dotActive: {
    borderColor: '#f97316',
    backgroundColor: `${'#f97316'}15`,
    borderWidth: 2,
  },
  check: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '700',
  },
  count: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
