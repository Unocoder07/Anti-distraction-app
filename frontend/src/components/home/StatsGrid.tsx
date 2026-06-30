import { router } from 'expo-router';
import { Award, Coins, TrendingUp } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/src/theme';
import type { ThemeColors } from '@/src/theme';
import { RADIUS, SPACING } from '../../constants/spacing';

interface StatsGridProps {
  coins: number;
  level: number;
  levelProgress: number;
  achievementLevel: string;
  achievementName: string;
}

export function StatsGrid({
  coins,
  level,
  levelProgress,
  achievementLevel,
  achievementName,
}: StatsGridProps) {
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const clampedLevelProgress = Math.round(Math.max(0, Math.min(100, levelProgress)));

  return (
    <View style={styles.container}>
      {/* Top Row: Coins and Level Rank */}
      <View style={styles.row}>
        {/* Focus Coins */}
        <View style={[styles.card, styles.coinsCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.iconBox}>
              <Coins size={18} color="#facc15" />
            </View>
            <Text style={styles.cardLabel}>Focus Coins</Text>
          </View>
          <Text style={styles.coinsValue}>{coins.toLocaleString()}</Text>
          <Text style={styles.coinsUnit}>total FC</Text>
        </View>

        {/* Level Rank - Now Clickable */}
        <Pressable
          style={[styles.card, styles.levelCard]}
          onPress={() => router.push('/achievement-levels' as any)}
        >
          <View style={styles.levelTopRow}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, styles.levelIconBox]}>
                <TrendingUp size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.cardLabel}>Level</Text>
            </View>

            <View style={styles.rankBadge}>
              <Award size={12} color="#c4b5fd" />
              <Text style={styles.rankBadgeText} numberOfLines={1}>
                {achievementLevel}
              </Text>
            </View>
          </View>

          <View style={styles.levelValueRow}>
            <Text style={styles.levelPrefix}>LVL</Text>
            <Text style={styles.levelValue}>{level}</Text>
          </View>

          <Text style={styles.rankName} numberOfLines={1}>
            {achievementName}
          </Text>

          <View style={styles.levelTrack}>
            <View style={[styles.levelFill, { width: `${clampedLevelProgress}%` }]} />
          </View>
          <Text style={styles.levelLabel}>{clampedLevelProgress}% to next level</Text>
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: {
    gap: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    minHeight: 136,
  },
  coinsCard: {
    flex: 1,
    justifyContent: 'space-between',
  },
  levelCard: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(250,204,21,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelIconBox: {
    backgroundColor: 'rgba(20,184,166,0.12)',
  },
  cardLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  coinsValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#facc15',
    marginTop: 14,
  },
  coinsUnit: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  levelTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rankBadge: {
    maxWidth: 86,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(139,92,246,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.28)',
  },
  rankBadgeText: {
    flexShrink: 1,
    fontSize: 10,
    color: '#c4b5fd',
    fontWeight: '700',
  },
  levelValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 12,
  },
  levelPrefix: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '800',
  },
  levelValue: {
    fontSize: 30,
    fontWeight: '700',
    color: COLORS.primary,
  },
  rankName: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '600',
    marginTop: 1,
    marginBottom: 10,
  },
  levelTrack: {
    width: '100%',
    height: 6,
    backgroundColor: COLORS.card,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 5,
  },
  levelFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  levelLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
  },
});
