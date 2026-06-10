import { TrendingUp, Trophy } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants/colors';

interface FocusCoinCardProps {
  coins: number;
  level?: number;
  xpPercent?: number;
}

export function FocusCoinCard({
  coins,
  level = 12,
  xpPercent = 65,
}: FocusCoinCardProps) {
  return (
    <View style={styles.card}>
      {/* Left: coin balance */}
      <View style={styles.left}>
        <View style={styles.iconWrap}>
          <Trophy size={18} color="#facc15" />
        </View>
        <View>
          <Text style={styles.label}>Focus Coins</Text>
          <Text style={styles.value}>{coins.toLocaleString()} FC</Text>
        </View>
      </View>

      {/* Right: level + XP bar */}
      <View style={styles.right}>
        <View style={styles.levelRow}>
          <TrendingUp size={12} color={COLORS.textSecondary} />
          <Text style={styles.levelText}>LVL {level}</Text>
        </View>
        <View style={styles.xpTrack}>
          <View style={[styles.xpFill, { width: `${xpPercent}%` as any }]} />
        </View>
        <Text style={styles.xpLabel}>{xpPercent}% to next</Text>
      </View>
    </View>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(250,204,21,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: '#facc15',
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  levelText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  xpTrack: {
    width: 72,
    height: 6,
    backgroundColor: COLORS.card,
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  xpLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
  },
});
