import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants/colors';

type PetMood = 'optimal' | 'happy' | 'tired' | 'sad';

interface PetCardProps {
  mood?: PetMood;
  loyalty?: number;
  health?: number;
}

const MOOD_CONFIG: Record<PetMood, { label: string; color: string; orbColor: string }> = {
  optimal: { label: 'Optimal', color: '#2dd4bf', orbColor: '#14b8a6' },
  happy:   { label: 'Happy',   color: '#4ade80', orbColor: '#22c55e' },
  tired:   { label: 'Tired',   color: '#f59e0b', orbColor: '#d97706' },
  sad:     { label: 'Sad',     color: '#f87171', orbColor: '#ef4444' },
};

export function PetCard({
  mood = 'optimal',
  loyalty = 88,
  health = 95,
}: PetCardProps) {
  const config = MOOD_CONFIG[mood];

  return (
    <View style={styles.card}>
      {/* Background glow */}
      <View style={[styles.glow, { backgroundColor: config.orbColor }]} />

      <View style={styles.inner}>
        {/* Info */}
        <View style={styles.info}>
          <Text style={[styles.statusLabel, { color: config.color }]}>
            Entity Status
          </Text>
          <Text style={styles.statusValue}>{config.label}</Text>

          <View style={styles.statsRow}>
            <StatPill label="Loyalty" value={`${loyalty}%`} color={config.color} />
            <StatPill label="Health" value={`${health}%`} color="#4ade80" />
          </View>

          <View style={styles.badge}>
            <View style={styles.dot} />
            <Text style={styles.badgeText}>Active</Text>
          </View>
        </View>

        {/* Orb */}
        <View style={styles.orbOuter}>
          <View style={[styles.orbInner, { backgroundColor: config.orbColor }]}>
            {/* Eyes */}
            <View style={styles.eyes}>
              <View style={styles.eye} />
              <View style={styles.eye} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={[styles.pillValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 160,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    top: '50%',
    left: '50%',
    marginLeft: -70,
    marginTop: -70,
    opacity: 0.12,
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  info: {
    gap: 4,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statusValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  pill: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignItems: 'center',
  },
  pillLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pillValue: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.card,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ade80',
  },
  badgeText: {
    fontSize: 10,
    color: '#4ade80',
    fontWeight: '500',
  },
  orbOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(45,212,191,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 16px #2dd4bf80', // 0.5 opacity
    elevation: 8,
  },
  eyes: {
    flexDirection: 'row',
    gap: 8,
  },
  eye: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0f172a',
  },
});
