import { Minus, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants/colors';
import { RADIUS, SPACING } from '../../constants/spacing';

interface TimeAdjusterProps {
  durationMinutes: number;
  onIncrease: () => void;
  onDecrease: () => void;
  minMinutes?: number;
  maxMinutes?: number;
}

export function TimeAdjuster({
  durationMinutes,
  onIncrease,
  onDecrease,
  minMinutes = 5,
  maxMinutes = 120,
}: TimeAdjusterProps) {
  const canDecrease = durationMinutes > minMinutes;
  const canIncrease = durationMinutes < maxMinutes;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Session Duration</Text>
      <View style={styles.controls}>
        <Pressable
          style={[styles.button, !canDecrease && styles.buttonDisabled]}
          onPress={onDecrease}
          disabled={!canDecrease}
        >
          <Minus size={20} color={canDecrease ? COLORS.text : COLORS.textSecondary} />
        </Pressable>

        <View style={styles.timeDisplay}>
          <Text style={styles.timeValue}>{durationMinutes}</Text>
          <Text style={styles.timeUnit}>min</Text>
        </View>

        <Pressable
          style={[styles.button, !canIncrease && styles.buttonDisabled]}
          onPress={onIncrease}
          disabled={!canIncrease}
        >
          <Plus size={20} color={canIncrease ? COLORS.text : COLORS.textSecondary} />
        </Pressable>
      </View>
      <Text style={styles.hint}>
        Adjust your focus session length (5-120 minutes)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  button: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    minWidth: 80,
    justifyContent: 'center',
  },
  timeValue: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  timeUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  hint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
