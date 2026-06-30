import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/src/theme';
import type { ThemeColors } from '@/src/theme';

const SIZE = 260;
const RADIUS = 110;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CENTER = SIZE / 2;

interface FocusTimerProps {
  /** Seconds remaining */
  timeLeft: number;
  /** Total session duration in seconds */
  totalSeconds: number;
  /** Label shown below the time, e.g. "Remaining" */
  label?: string;
  /** Phase label shown above, e.g. "Deep Work Mode" */
  modeLabel?: string;
  /** Phase indicator, e.g. "Phase 1 / 4" */
  phaseLabel?: string;
  /** Whether the timer is currently running */
  isActive?: boolean;
}

export function FocusTimer({
  timeLeft,
  totalSeconds,
  label = 'Remaining',
  modeLabel = 'Deep Work Mode',
  phaseLabel,
  isActive = true,
}: FocusTimerProps) {
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const progress = totalSeconds > 0 ? timeLeft / totalSeconds : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  // Ring color shifts orange when paused
  const ringColor = isActive ? COLORS.primary : '#f97316';

  // Pulse animation for the glow ring
  const pulseValue = useSharedValue(0.3);

  useEffect(() => {
    if (isActive) {
      pulseValue.value = withRepeat(
        withTiming(0.7, {
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true,
      );
    } else {
      cancelAnimation(pulseValue);
      pulseValue.value = 0.3;
    }

    return () => cancelAnimation(pulseValue);
  }, [isActive, pulseValue]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: pulseValue.value,
    transform: [{ scale: 1 + pulseValue.value * 0.04 }],
  }));

  return (
    <View style={styles.container}>
      {/* Mode labels */}
      {modeLabel ? (
        <Text style={[styles.modeLabel, { color: ringColor }]}>{modeLabel}</Text>
      ) : null}
      {phaseLabel ? (
        <Text style={styles.phaseLabel}>{phaseLabel}</Text>
      ) : null}

      {/* SVG ring + time */}
      <View style={styles.ringWrap}>
        {/* Animated glow behind the ring */}
        {isActive && (
          <Animated.View style={[styles.glowRing, { borderColor: ringColor }, glowStyle]} />
        )}

        <Svg width={SIZE} height={SIZE}>
          {/* Track */}
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            stroke={COLORS.card}
            strokeWidth={8}
            fill="none"
          />
          {/* Glow layer (thicker, semi-transparent) */}
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            stroke={ringColor}
            strokeWidth={16}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${CENTER},${CENTER}`}
            opacity={0.15}
          />
          {/* Progress */}
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            stroke={ringColor}
            strokeWidth={8}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${CENTER},${CENTER}`}
          />
        </Svg>

        {/* Time text overlay */}
        <View style={styles.timeOverlay}>
          <Text style={styles.timeText}>
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </Text>
          <Text style={styles.timeLabel}>{label}</Text>
          {/* Elapsed progress bar */}
          <View style={styles.miniProgress}>
            <View
              style={[
                styles.miniProgressFill,
                { width: `${progress * 100}%`, backgroundColor: ringColor },
              ]}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
  },
  modeLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  phaseLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  ringWrap: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  glowRing: {
    position: 'absolute',
    width: SIZE + 20,
    height: SIZE + 20,
    borderRadius: (SIZE + 20) / 2,
    borderWidth: 20,
    opacity: 0.3,
  },
  timeOverlay: {
    position: 'absolute',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 56,
    fontWeight: '300',
    color: COLORS.text,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  timeLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 4,
  },
  miniProgress: {
    width: 80,
    height: 3,
    backgroundColor: COLORS.card,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
