import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/src/theme';
import type { ThemeColors } from '@/src/theme';

interface GradientButtonProps {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
  /** 'primary' = teal, 'danger' = red, 'ghost' = outlined */
  variant?: 'primary' | 'danger' | 'ghost';
  disabled?: boolean;
  fullWidth?: boolean;
}

export function GradientButton({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled = false,
  fullWidth = true,
}: GradientButtonProps) {
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }: { pressed: boolean }) => [
        styles.btn,
        variant === 'primary' && styles.primary,
        variant === 'danger' && styles.danger,
        variant === 'ghost' && styles.ghost,
        fullWidth && styles.fullWidth,
        (pressed || disabled) && styles.pressed,
      ]}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text
        style={[
          styles.label,
          variant === 'ghost' && styles.labelGhost,
          variant === 'danger' && styles.labelDanger,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  fullWidth: {
    width: '100%',
  },
  primary: {
    backgroundColor: COLORS.primary,
    boxShadow: `0 0 16px ${COLORS.primary}5A`, // 0.35 opacity
    elevation: 6,
  },
  danger: {
    backgroundColor: COLORS.danger,
    boxShadow: `0 0 12px ${COLORS.danger}40`, // 0.25 opacity
    elevation: 4,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.background,
  },
  labelGhost: {
    color: COLORS.textSecondary,
  },
  labelDanger: {
    color: '#fff',
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
