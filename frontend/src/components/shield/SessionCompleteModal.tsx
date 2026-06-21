/**
 * SessionCompleteModal - Celebration with Rewards
 */

import { COLORS } from '@/src/constants/colors';
import { RADIUS, SPACING } from '@/src/constants/spacing';
import { Award, Coins } from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

interface SessionCompleteModalProps {
  visible: boolean;
  coinsEarned: number;
  duration: number; // minutes
  onClose: () => void;
}

export function SessionCompleteModal({
  visible,
  coinsEarned,
  duration,
  onClose,
}: SessionCompleteModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.modal} onStartShouldSetResponder={() => true}>
          {/* Success Icon */}
          <View style={styles.iconBox}>
            <Award size={40} color={COLORS.primary} />
          </View>

          {/* Congrats */}
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>Focus Session Complete!</Text>
          <Text style={styles.description}>
            You stayed focused for <Text style={styles.highlight}>{duration} minutes</Text> and
            earned your reward!
          </Text>

          {/* Reward */}
          <View style={styles.rewardBox}>
            <Coins size={24} color={COLORS.warning} />
            <Text style={styles.rewardText}>+{coinsEarned} coins</Text>
          </View>

          {/* Stats */}
          <View style={styles.stats}>
            <Text style={styles.statsText}>
              Keep building your focus streak to unlock more rewards! 🚀
            </Text>
          </View>

          {/* Button */}
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>Awesome!</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },

  modal: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    gap: SPACING.md,
    alignItems: 'center',
  },

  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emoji: {
    fontSize: 48,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },

  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  highlight: {
    fontWeight: '700',
    color: COLORS.primary,
  },

  rewardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: `${COLORS.warning}15`,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.warning,
    marginVertical: SPACING.sm,
  },

  rewardText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.warning,
  },

  stats: {
    width: '100%',
    backgroundColor: `${COLORS.primary}08`,
    borderWidth: 1,
    borderColor: `${COLORS.primary}20`,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
  },

  statsText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },

  button: {
    width: '100%',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },

  buttonPressed: {
    opacity: 0.8,
  },

  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
