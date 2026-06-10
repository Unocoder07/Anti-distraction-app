import { router } from 'expo-router';
import { Award, Coins, TrendingUp } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants/colors';
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
  return (
    <View style={styles.container}>
      {/* Top Row: Coins and Level */}
      <View style={styles.row}>
        {/* Focus Coins */}
        <View style={[styles.card, styles.coinsCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.iconBox}>
              <Coins size={18} color="#facc15" />
            </View>
            <Text style={styles.cardLabel}>Focus Coins</Text>
          </View>
          <Text style={styles.coinsValue}>{coins.toLocaleString()} FC</Text>
        </View>

        {/* Level - Now Clickable */}
        <Pressable
          style={[styles.card, styles.levelCard]}
          onPress={() => router.push('/achievement-levels' as any)}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, styles.levelIconBox]}>
              <TrendingUp size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.cardLabel}>Level</Text>
          </View>
          <Text style={styles.levelValue}>{level}</Text>
          <View style={styles.levelTrack}>
            <View style={[styles.levelFill, { width: `${levelProgress}%` }]} />
          </View>
          <Text style={styles.levelLabel}>{levelProgress}% to next</Text>
        </Pressable>
      </View>

      {/* Bottom Row: Achievement - Now Clickable */}
      <Pressable
        style={[styles.card, styles.achievementCard]}
        onPress={() => router.push('/achievement-levels' as any)}
      >
        <View style={styles.achievementContent}>
          <View style={styles.achievementIconBox}>
            <Award size={24} color="#8b5cf6" />
          </View>
          <View style={styles.achievementInfo}>
            <Text style={styles.achievementLabel}>Achievement Rank</Text>
            <Text style={styles.achievementLevel}>{achievementLevel}</Text>
            <Text style={styles.achievementName}>{achievementName}</Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
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
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  coinsCard: {
    flex: 1,
  },
  levelCard: {
    flex: 1,
  },
  achievementCard: {
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
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
    letterSpacing: 0.5,
  },
  coinsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#facc15',
  },
  levelValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  levelTrack: {
    width: '100%',
    height: 6,
    backgroundColor: COLORS.card,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
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
  achievementContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  achievementIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(139,92,246,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  achievementLevel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8b5cf6',
    marginBottom: 2,
  },
  achievementName: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
  },
});
