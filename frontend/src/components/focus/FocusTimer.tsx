import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS } from '../../constants/colors';

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
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const progress = totalSeconds > 0 ? timeLeft / totalSeconds : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  // Ring color shifts orange when paused
  const ringColor = isActive ? COLORS.primary : '#f97316';

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
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
