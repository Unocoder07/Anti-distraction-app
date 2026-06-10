import { Lock } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants/colors';

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  unlocked: boolean;
  /** Progress toward unlock, 0–100. Only shown when not yet unlocked. */
  progress?: number;
  /** Date string shown when unlocked, e.g. "May 2026" */
  unlockedAt?: string;
}

interface AchievementCardProps {
  achievement: Achievement;
}

const RARITY_CONFIG: Record<
  AchievementRarity,
  { label: string; color: string; bg: string; border: string }
> = {
  common:    { label: 'Common',    color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)' },
  rare:      { label: 'Rare',      color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.2)'  },
  epic:      { label: 'Epic',      color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)' },
  legendary: { label: 'Legendary', color: '#facc15', bg: 'rgba(250,204,21,0.08)',  border: 'rgba(250,204,21,0.25)' },
};

export function AchievementCard({ achievement: a }: AchievementCardProps) {
  const rarity = RARITY_CONFIG[a.rarity];

  return (
    <View
      style={[
        styles.card,
        a.unlocked
          ? { borderColor: rarity.border, backgroundColor: rarity.bg }
          : styles.cardLocked,
      ]}
    >
      {/* Icon */}
      <View style={[styles.iconWrap, !a.unlocked && styles.iconWrapLocked]}>
        {a.unlocked ? (
          <Text style={styles.emoji}>{a.icon}</Text>
        ) : (
          <Lock size={18} color={COLORS.textSecondary} />
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, !a.unlocked && styles.titleLocked]}>
            {a.title}
          </Text>
          <View style={[styles.rarityBadge, { borderColor: rarity.border }]}>
            <Text style={[styles.rarityText, { color: rarity.color }]}>
              {rarity.label}
            </Text>
          </View>
        </View>

        <Text style={styles.desc} numberOfLines={2}>
          {a.description}
        </Text>

        {/* Progress bar — only when locked and progress provided */}
        {!a.unlocked && a.progress !== undefined && (
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${a.progress}%` as any }]} />
            </View>
            <Text style={styles.progressLabel}>{a.progress}%</Text>
          </View>
        )}

        {/* Unlock date */}
        {a.unlocked && a.unlockedAt && (
          <Text style={[styles.unlockedAt, { color: rarity.color }]}>
            ✓ Unlocked {a.unlockedAt}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  cardLocked: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    opacity: 0.7,
  },

  // Icon
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconWrapLocked: {
    backgroundColor: COLORS.background,
  },
  emoji: {
    fontSize: 24,
  },

  // Info
  info: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  titleLocked: {
    color: COLORS.textSecondary,
  },
  rarityBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  rarityText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  desc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },

  // Progress
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.background,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
    width: 30,
    textAlign: 'right',
  },

  // Unlocked date
  unlockedAt: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});
