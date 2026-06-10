import { Pause, Play, ShieldAlert, Square } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants/colors';

interface SessionControlsProps {
  isActive: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  onShield: () => void;
  /** Label shown below controls, e.g. "Simulate App Interruption" */
  debugLabel?: string;
  onDebug?: () => void;
}

export function SessionControls({
  isActive,
  onPlayPause,
  onStop,
  onShield,
  debugLabel,
  onDebug,
}: SessionControlsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Stop */}
        <Pressable
          style={({ pressed }: { pressed: boolean }) => [styles.sideBtn, pressed && styles.pressed]}
          onPress={onStop}
          hitSlop={8}
        >
          <Square size={20} color={COLORS.textSecondary} fill={COLORS.textSecondary} />
        </Pressable>

        {/* Play / Pause */}
        <Pressable
          style={({ pressed }: { pressed: boolean }) => [
            styles.playBtn,
            !isActive && styles.playBtnPaused,
            pressed && styles.pressed,
          ]}
          onPress={onPlayPause}
        >
          {isActive ? (
            <Pause size={32} color={COLORS.background} fill={COLORS.background} />
          ) : (
            <Play size={32} color={COLORS.background} fill={COLORS.background} />
          )}
        </Pressable>

        {/* Shield */}
        <Pressable
          style={({ pressed }: { pressed: boolean }) => [styles.sideBtn, pressed && styles.pressed]}
          onPress={onShield}
          hitSlop={8}
        >
          <ShieldAlert size={20} color={COLORS.textSecondary} />
        </Pressable>
      </View>

      {/* Debug / simulate button */}
      {debugLabel && onDebug && (
        <Pressable onPress={onDebug} hitSlop={8}>
          <Text style={styles.debugBtn}>{debugLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  sideBtn: {
    width: 56,
    height: 56,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.primary,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0 0 24px ${COLORS.primary}73`, // 0.45 opacity
    elevation: 10,
  },
  playBtnPaused: {
    backgroundColor: '#f97316',
    boxShadow: '0 0 24px #f9731673', // 0.45 opacity
  },
  pressed: {
    opacity: 0.75,
  },
  debugBtn: {
    fontSize: 12,
    color: COLORS.border,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
});
