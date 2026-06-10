import { AlertTriangle, X } from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants/colors';
import type { BlockedApp } from './BlockedAppCard';

interface Penalty {
  label: string;
  isWarning?: boolean;
}

const DEFAULT_PENALTIES: Penalty[] = [
  { label: 'Lose 50 Focus Points immediately' },
  { label: 'Break your blocking session' },
  { label: 'Miss out on +20 FP reward' },
  { label: 'Session marked as BROKEN', isWarning: true },
];

interface UnlockDialogProps {
  visible: boolean;
  app: BlockedApp | null;
  penalties?: Penalty[];
  motivationQuote?: string;
  onReturnToFocus: () => void;
  onConfirmUnlock: (app: BlockedApp) => void;
  onDismiss: () => void;
}

export function UnlockDialog({
  visible,
  app,
  penalties = DEFAULT_PENALTIES,
  motivationQuote = "You've worked hard to earn Focus Points. Don't sacrifice your progress for a few minutes of distraction. Stay strong!",
  onReturnToFocus,
  onConfirmUnlock,
  onDismiss,
}: UnlockDialogProps) {
  if (!app) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Dismiss X */}
          <Pressable style={styles.closeBtn} onPress={onDismiss} hitSlop={8}>
            <X size={16} color={COLORS.textSecondary} />
          </Pressable>

          {/* Warning icon */}
          <View style={styles.warningIcon}>
            <AlertTriangle size={32} color={COLORS.danger} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Access Blocked</Text>
          <Text style={styles.desc}>
            You are trying to open{' '}
            <Text style={styles.appName}>{app.name}</Text>
            {' '}during an active Focus Session.
          </Text>

          {/* Penalty list */}
          <View style={styles.penaltyBox}>
            <Text style={styles.penaltyTitle}>Penalty for Unlocking:</Text>
            {penalties.map((p, i) => (
              <View key={i} style={styles.penaltyRow}>
                <View style={[styles.penaltyBullet, p.isWarning && styles.penaltyBulletWarn]} />
                <Text style={[styles.penaltyText, p.isWarning && styles.penaltyTextWarn]}>
                  {p.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Motivation quote */}
          <View style={styles.quoteBox}>
            <Text style={styles.quoteText}>&ldquo;{motivationQuote}&rdquo;</Text>
          </View>

          {/* Actions */}
          <Pressable
            style={({ pressed }: { pressed: boolean }) => [styles.returnBtn, pressed && { opacity: 0.85 }]}
            onPress={onReturnToFocus}
          >
            <Text style={styles.returnBtnText}>Return to Focus</Text>
          </Pressable>

          <Pressable
            style={({ pressed }: { pressed: boolean }) => [styles.unlockBtn, pressed && { opacity: 0.7 }]}
            onPress={() => onConfirmUnlock(app)}
          >
            <Text style={styles.unlockBtnText}>Sacrifice Progress & Unlock</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: 'rgba(153,27,27,0.5)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Warning icon
  warningIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },

  // Text
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  desc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  appName: {
    color: COLORS.text,
    fontWeight: '700',
  },

  // Penalty box
  penaltyBox: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  penaltyTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  penaltyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  penaltyBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.danger,
  },
  penaltyBulletWarn: {
    backgroundColor: COLORS.warning,
  },
  penaltyText: {
    fontSize: 13,
    color: '#f87171',
  },
  penaltyTextWarn: {
    color: '#fbbf24',
  },

  // Quote
  quoteBox: {
    width: '100%',
    backgroundColor: 'rgba(20,184,166,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.2)',
    borderRadius: 10,
    padding: 12,
  },
  quoteText: {
    fontSize: 12,
    color: COLORS.primary,
    fontStyle: 'italic',
    fontWeight: '500',
    lineHeight: 18,
    textAlign: 'center',
  },

  // Buttons
  returnBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    boxShadow: `0 0 16px ${COLORS.primary}5A`, // 0.35 opacity
    elevation: 6,
  },
  returnBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.background,
  },
  unlockBtn: {
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  unlockBtnText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
