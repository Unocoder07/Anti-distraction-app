/**
 * AppCard - Selectable App Card Component
 */

import { RADIUS, SPACING } from '@/src/constants/spacing';
import { useTheme } from '@/src/theme';
import type { ThemeColors } from '@/src/theme';
import { Check } from 'lucide-react-native';
import { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

interface AppCardProps {
  appName: string;
  icon: string;
  category: string;
  isSelected: boolean;
  onToggle: () => void;
}

export function AppCard({ appName, icon, category, isSelected, onToggle }: AppCardProps) {
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const hasImageIcon = /^(data:image\/|https?:\/\/|file:\/\/|content:\/\/)/i.test(icon);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isSelected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
      onPress={onToggle}
    >
      {/* Icon */}
      <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
        {hasImageIcon ? (
          <Image source={{ uri: icon }} style={styles.logo} resizeMode="contain" />
        ) : (
          <Text style={styles.icon}>{icon}</Text>
        )}
      </View>

      {/* App Info */}
      <View style={styles.info}>
        <Text style={styles.appName} numberOfLines={1}>
          {appName}
        </Text>
        <Text style={styles.category} numberOfLines={1}>
          {category}
        </Text>
      </View>

      {/* Checkbox */}
      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
        {isSelected && <Check size={16} color="#fff" strokeWidth={3} />}
      </View>
    </Pressable>
  );
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
  },
  cardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}08`,
  },
  cardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },

  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxSelected: {
    backgroundColor: `${COLORS.primary}20`,
  },
  icon: {
    fontSize: 24,
  },
  logo: {
    width: 34,
    height: 34,
    borderRadius: 8,
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

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
});
