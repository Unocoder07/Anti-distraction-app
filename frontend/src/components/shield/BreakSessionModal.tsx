/**
 * BreakSessionModal - Confirmation Dialog with Penalty Warning
 */

import { COLORS } from '@/src/constants/colors';
import { RADIUS, SPACING } from '@/src/constants/spacing';
import { AlertTriangle } from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

interface BreakSessionModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function BreakSessionModal({ visible, onCancel, onConfirm }: BreakSessionModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <View style={styles.modal} onStartShouldSetResponder={() => true}>
          {/* Icon */}
          <View style={styles.iconBox}>
            <AlertTriangle size={32} color={COLORS.error} />
          </View>

          {/* Content */}
          <Text style={styles.title}>End Session Early?</Text>
          <Text style={styles.description}>
            Breaking your focus session early will cost you{' '}
            <Text style={styles.penalty}>50 coins</Text>.
          </Text>
          <Text style={styles.tip}>💡 Tip: Complete the session to earn 30 coins instead!</Text>

          {/* Buttons */}
          <View style={styles.buttons}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Keep Going</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.confirmButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmButtonText}>End (-50 coins)</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },

  modal: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    gap: SPACING.md,
    alignItems: 'center',
  },

  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${COLORS.error}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: 20,
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

  penalty: {
    fontWeight: '700',
    color: COLORS.error,
  },

  tip: {
    fontSize: 12,
    color: COLORS.primary,
    textAlign: 'center',
    backgroundColor: `${COLORS.primary}10`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
  },

  buttons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    width: '100%',
    marginTop: SPACING.sm,
  },

  button: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },

  buttonPressed: {
    opacity: 0.7,
  },

  cancelButton: {
    backgroundColor: COLORS.primary,
  },

  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },

  confirmButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.error,
  },
});
