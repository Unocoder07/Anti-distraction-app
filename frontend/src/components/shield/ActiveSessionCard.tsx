/**
 * ActiveSessionCard - Running Session Card with Live Timer
 */

import { RADIUS, SPACING } from '@/src/constants/spacing';
import { BlockedApp, getBlockedAppTimeRemaining } from '@/src/services/shieldSessionManager';
import { useTheme } from '@/src/theme';
import type { ThemeColors } from '@/src/theme';
import { Trash2 } from 'lucide-react-native';
import { useMemo } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

interface ActiveSessionCardProps {
  app: BlockedApp;
  timeRemaining: number; // seconds
  onDelete: () => void;
}

export function ActiveSessionCard({ app, timeRemaining, onDelete }: ActiveSessionCardProps) {
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const appTimeRemaining = getBlockedAppTimeRemaining(app);
  const displayTimeRemaining = appTimeRemaining > 0 ? appTimeRemaining : timeRemaining;
  const minutes = Math.floor(displayTimeRemaining / 60);
  const seconds = displayTimeRemaining % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const durationSeconds = (app.sessionDuration ?? 0) * 60;
  const progress = durationSeconds > 0
    ? Math.max(0, Math.min(1, displayTimeRemaining / durationSeconds))
    : displayTimeRemaining > 0 ? 1 : 0;
  const hasImageIcon = /^(data:image\/|https?:\/\/|file:\/\/|content:\/\/)/i.test(app.icon);

  const handleDelete = () => {
    Alert.alert(
      'Remove App Block?',
      `${app.appName} will be unblocked immediately. Session will continue for other apps.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: onDelete,
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Icon & Info */}
        <View style={styles.left}>
          <View style={styles.iconBox}>
            {hasImageIcon ? (
              <Image source={{ uri: app.icon }} style={styles.logo} resizeMode="contain" />
            ) : (
              <Text style={styles.icon}>{app.icon}</Text>
            )}
          </View>
          <View style={styles.info}>
            <Text style={styles.appName} numberOfLines={1}>
              {app.appName}
            </Text>
            <Text style={styles.category} numberOfLines={1}>
              {app.category}
            </Text>
          </View>
        </View>

        {/* Timer & Delete */}
        <View style={styles.right}>
          <View style={styles.timerBox}>
            <Text style={styles.timerText}>{timeDisplay}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.deleteButton, pressed && styles.deleteButtonPressed]}
            onPress={handleDelete}
          >
            <Trash2 size={16} color={COLORS.error} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },

  progressBar: {
    height: 3,
    backgroundColor: `${COLORS.primary}20`,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },

  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.sm,
    gap: SPACING.sm,
  },

  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },

  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
  logo: {
    width: 30,
    height: 30,
    borderRadius: 7,
  },

  info: {
    flex: 1,
    gap: 2,
  },
  appName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  category: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },

  timerBox: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    backgroundColor: `${COLORS.primary}15`,
    minWidth: 60,
    alignItems: 'center',
  },
  timerText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    fontVariant: ['tabular-nums'],
  },

  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${COLORS.error}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.95 }],
  },
});
