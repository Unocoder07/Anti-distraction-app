import { ChevronRight } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/src/theme';
import type { ThemeColors } from '@/src/theme';

export interface ProfileMenuItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  /** Shows a value badge on the right, e.g. "UPSC 2026" */
  badge?: string;
  isDestructive?: boolean;
  onPress?: () => void;
}

interface ProfileMenuProps {
  title?: string;
  items: ProfileMenuItem[];
}

export function ProfileMenu({ title, items }: ProfileMenuProps) {
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  return (
    <View style={styles.section}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      <View style={styles.list}>
        {items.map((item, index) => (
          <Pressable
            key={item.id}
            style={({ pressed }: { pressed: boolean }) => [
              styles.row,
              item.isDestructive && styles.rowDestructive,
              index < items.length - 1 && styles.rowBorder,
              pressed && styles.rowPressed,
            ]}
            onPress={item.onPress}
          >
            {/* Icon */}
            <View
              style={[
                styles.iconWrap,
                item.isDestructive && styles.iconWrapDestructive,
              ]}
            >
              {item.icon}
            </View>

            {/* Text */}
            <View style={styles.textWrap}>
              <Text
                style={[
                  styles.title,
                  item.isDestructive && styles.titleDestructive,
                ]}
              >
                {item.title}
              </Text>
              {item.subtitle && (
                <Text style={styles.subtitle}>{item.subtitle}</Text>
              )}
            </View>

            {/* Right side */}
            {item.badge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            ) : (
              <ChevronRight
                size={16}
                color={item.isDestructive ? 'rgba(153,27,27,0.6)' : COLORS.border}
              />
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 4,
  },
  list: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.card,
  },
  rowDestructive: {
    backgroundColor: 'rgba(239,68,68,0.04)',
  },
  rowPressed: {
    opacity: 0.7,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapDestructive: {
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  titleDestructive: {
    color: '#f87171',
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  badge: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
