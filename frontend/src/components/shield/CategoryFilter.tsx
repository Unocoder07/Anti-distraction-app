/**
 * CategoryFilter - Category Selection Tabs
 */

import { SPACING } from '@/src/constants/spacing';
import { useTheme } from '@/src/theme';
import type { ThemeColors } from '@/src/theme';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

type Category = 'All' | 'Social Media' | 'Gaming' | 'Entertainment' | 'Short Video';

interface CategoryFilterProps {
  selected: Category;
  onSelect: (category: Category) => void;
}

const CATEGORIES: Category[] = ['All', 'Social Media', 'Gaming', 'Entertainment', 'Short Video'];

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {CATEGORIES.map((category) => (
        <Pressable
          key={category}
          style={({ pressed }) => [
            styles.tab,
            selected === category && styles.tabSelected,
            pressed && styles.tabPressed,
          ]}
          onPress={() => onSelect(category)}
        >
          <Text
            style={[
              styles.tabText,
              selected === category && styles.tabTextSelected,
            ]}
          >
            {category}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: {
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  tab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabPressed: {
    opacity: 0.7,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextSelected: {
    color: '#fff',
  },
});
