import { Pressable, StyleSheet, View } from 'react-native';
import { COLORS } from '../../constants/colors';

interface CustomCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  /** Extra style overrides */
  style?: object;
  /** Teal accent border when true */
  accent?: boolean;
}

export function CustomCard({ children, onPress, style, accent = false }: CustomCardProps) {
  const card = (
    <View
      style={[
        styles.card,
        accent && styles.cardAccent,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }: { pressed: boolean }) => [{ opacity: pressed ? 0.85 : 1 }]}
      >
        {card}
      </Pressable>
    );
  }

  return card;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
  },
  cardAccent: {
    borderColor: 'rgba(20,184,166,0.4)',
    backgroundColor: 'rgba(19,78,74,0.15)',
  },
});
