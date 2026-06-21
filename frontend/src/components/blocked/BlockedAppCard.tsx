import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants/colors';

export interface BlockedApp {
  id: number;
  name: string;
  category: string;
  icon: string;
  logo?: string; // URL for real logo
  blocked: boolean;
  packageName?: string; // Android package name
  bundleId?: string; // iOS bundle ID
}

interface BlockedAppCardProps {
  app: BlockedApp;
  onToggle: (id: number) => void;
  /** Called when user tries to unblock during an active focus session */
  onUnlockAttempt?: (app: BlockedApp) => void;
  /** If true, tapping "BLOCKED" opens the unlock dialog instead of toggling */
  focusActive?: boolean;
}

export function BlockedAppCard({
  app,
  onToggle,
  onUnlockAttempt,
  focusActive = false,
}: BlockedAppCardProps) {
  const [logoError, setLogoError] = useState(false);

  const handleStatusPress = () => {
    if (app.blocked && focusActive && onUnlockAttempt) {
      // During active blocking session — show penalty dialog
      onUnlockAttempt(app);
    } else {
      // Toggle blocking status
      onToggle(app.id);
    }
  };

  const handleCardPress = () => {
    if (app.blocked && !focusActive) {
      onToggle(app.id);
    }
  };

  return (
    <Pressable
      style={[styles.card, app.blocked && !focusActive && styles.cardBlocked]}
      onPress={handleCardPress}
    >
      {/* Left: icon + info */}
      <View style={styles.left}>
        <View style={styles.iconWrap}>
          {app.logo && !logoError ? (
            <Image
              source={{ uri: app.logo }}
              style={styles.logo}
              onError={() => setLogoError(true)}
            />
          ) : (
            <Text style={styles.emoji}>{app.icon}</Text>
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{app.name}</Text>
          <Text style={styles.category}>{app.category}</Text>
          {app.blocked && !focusActive && (
            <Text style={styles.hint}>Tap card to activate Shield</Text>
          )}
          {focusActive && (
            <Text style={styles.activeHint}>🛡️ Session active</Text>
          )}
        </View>
      </View>

      {/* Right: status toggle */}
      <Pressable
        style={({ pressed }: { pressed: boolean }) => [
          styles.badge,
          app.blocked ? styles.badgeBlocked : styles.badgeAllowed,
          pressed && styles.badgePressed,
        ]}
        onPress={handleStatusPress}
        hitSlop={8}
      >
        <View style={[styles.dot, app.blocked ? styles.dotBlocked : styles.dotAllowed]} />
        <Text style={[styles.badgeText, app.blocked ? styles.textBlocked : styles.textAllowed]}>
          {app.blocked ? 'BLOCKED' : 'ALLOWED'}
        </Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cardBlocked: {
    borderColor: 'rgba(239,68,68,0.25)',
    backgroundColor: 'rgba(239,68,68,0.04)',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  emoji: {
    fontSize: 22,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  category: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  hint: {
    fontSize: 10,
    color: COLORS.primary,
    marginTop: 3,
    fontWeight: '500',
  },
  activeHint: {
    fontSize: 10,
    color: COLORS.primary,
    marginTop: 3,
    fontWeight: '600',
  },

  // Badge
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeBlocked: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderColor: 'rgba(239,68,68,0.25)',
  },
  badgeAllowed: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
  },
  badgePressed: {
    opacity: 0.7,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotBlocked: {
    backgroundColor: COLORS.danger,
  },
  dotAllowed: {
    backgroundColor: COLORS.success,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textBlocked: {
    color: '#f87171',
  },
  textAllowed: {
    color: COLORS.textSecondary,
  },
});
