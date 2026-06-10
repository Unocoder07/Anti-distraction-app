import { AlertCircle, Clock, Coins, Shield, X } from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants/colors';
import { DEFAULT_SESSION_DURATION, PENALTY_COINS, REWARD_COINS } from '../../services/blockingService';
import type { BlockedApp } from './BlockedAppCard';

interface BlockingSessionDialogProps {
  visible: boolean;
  app: BlockedApp | null;
  duration?: number; // in minutes
  onStartSession: (app: BlockedApp, duration: number) => void;
  onDismiss: () => void;
}

export function BlockingSessionDialog({
  visible,
  app,
  duration = DEFAULT_SESSION_DURATION,
  onStartSession,
  onDismiss,
}: BlockingSessionDialogProps) {
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

          {/* Shield icon */}
          <View style={styles.shieldIcon}>
            <Shield size={32} color={COLORS.primary} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Start Blocking Session</Text>
          <Text style={styles.desc}>
            Block <Text style={styles.appName}>{app.name}</Text> and earn rewards for staying focused!
          </Text>

          {/* Session Info */}
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Clock size={16} color={COLORS.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Session Duration</Text>
                <Text style={styles.infoValue}>{duration} minutes</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, styles.successIcon]}>
                <Coins size={16} color={COLORS.success} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Reward for Completion</Text>
                <Text style={[styles.infoValue, styles.successText]}>+{REWARD_COINS} Focus Coins</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, styles.dangerIcon]}>
                <AlertCircle size={16} color={COLORS.danger} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Penalty for Breaking</Text>
                <Text style={[styles.infoValue, styles.dangerText]}>-{PENALTY_COINS} Focus Coins</Text>
              </View>
            </View>
          </View>

          {/* Rules */}
          <View style={styles.rulesBox}>
            <Text style={styles.rulesTitle}>📋 Session Rules</Text>
            <Text style={styles.ruleText}>✓ App will be blocked for {duration} minutes</Text>
            <Text style={styles.ruleText}>✓ Complete the session to earn {REWARD_COINS} coins</Text>
            <Text style={styles.ruleText}>✗ Unlocking early costs {PENALTY_COINS} coins</Text>
            <Text style={styles.ruleText}>✗ Breaking session damages your pet's health</Text>
          </View>

          {/* Motivation quote */}
          <View style={styles.quoteBox}>
            <Text style={styles.quoteText}>
              "Discipline is choosing between what you want now and what you want most."
            </Text>
          </View>

          {/* Actions */}
          <Pressable
            style={({ pressed }: { pressed: boolean }) => [
              styles.startBtn,
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => onStartSession(app, duration)}
          >
            <Shield size={18} color={COLORS.background} />
            <Text style={styles.startBtnText}>Start Blocking Session</Text>
          </Pressable>

          <Pressable
            style={({ pressed }: { pressed: boolean }) => [
              styles.cancelBtn,
              pressed && { opacity: 0.7 },
            ]}
            onPress={onDismiss}
          >
            <Text style={styles.cancelBtnText}>Maybe Later</Text>
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
    maxWidth: 420,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.3)',
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
    zIndex: 10,
  },

  // Shield icon
  shieldIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(20,184,166,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.2)',
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
    marginBottom: 4,
  },
  appName: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  // Info box
  infoBox: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(20,184,166,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    backgroundColor: 'rgba(34,197,94,0.1)',
  },
  dangerIcon: {
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  successText: {
    color: COLORS.success,
  },
  dangerText: {
    color: COLORS.danger,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },

  // Rules box
  rulesBox: {
    width: '100%',
    backgroundColor: 'rgba(20,184,166,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.15)',
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  rulesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  ruleText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
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
    fontSize: 11,
    color: COLORS.primary,
    fontStyle: 'italic',
    fontWeight: '500',
    lineHeight: 16,
    textAlign: 'center',
  },

  // Buttons
  startBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    boxShadow: `0 0 16px ${COLORS.primary}5A`, // 0.35 opacity
    elevation: 6,
  },
  startBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.background,
  },
  cancelBtn: {
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
