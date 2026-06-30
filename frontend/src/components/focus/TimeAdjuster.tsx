import { useMemo } from 'react';
import { Minus, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/src/theme';
import type { ThemeColors } from '@/src/theme';
import { RADIUS, SPACING } from '../../constants/spacing';

export interface DurationPreset {
  minutes: number;
  label: string;
}

interface TimeAdjusterProps {
  durationMinutes: number;
  onIncrease: () => void;
  onDecrease: () => void;
  minMinutes?: number;
  maxMinutes?: number;
  locked?: boolean;
  presets?: DurationPreset[];
  onSelectPreset?: (minutes: number) => void;
}

export function TimeAdjuster({
  durationMinutes,
  onIncrease,
  onDecrease,
  minMinutes = 5,
  maxMinutes = 120,
  locked = false,
  presets,
  onSelectPreset,
}: TimeAdjusterProps) {
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const canDecrease = !locked && durationMinutes > minMinutes;
  const canIncrease = !locked && durationMinutes < maxMinutes;
  const showPresets = !locked && !!presets?.length && !!onSelectPreset;

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
        {locked ? 'Synced with your Daily Directive' : 'Adjust your focus session length (5-120 minutes)'}
      </Text>

      {showPresets && (
        <View style={styles.presetRow}>
          {presets!.map((preset) => {
            const selected = durationMinutes === preset.minutes;
            return (
              <Pressable
                key={preset.minutes}
                style={({ pressed }) => [
                  styles.presetChip,
                  selected && styles.presetChipSelected,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => onSelectPreset!(preset.minutes)}
              >
                <Text
                  style={[styles.presetMinutes, selected && styles.presetAccent]}
                >
                  {preset.minutes}m
                </Text>
                <Text
                  style={[styles.presetLabel, selected && styles.presetAccent]}
                >
                  {preset.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
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
  presetRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    alignSelf: 'stretch',
  },
  presetChip: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: SPACING.sm,
    paddingHorizontal: 4,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  presetChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}1a`,
  },
  presetMinutes: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  presetLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  presetAccent: {
    color: COLORS.primary,
  },
});
