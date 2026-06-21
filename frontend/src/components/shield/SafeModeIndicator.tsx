/**
 * SafeModeIndicator - Banner when Banking App is Active
 */

import { COLORS } from '@/src/constants/colors';
import { RADIUS, SPACING } from '@/src/constants/spacing';
import { ShieldCheck } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

interface SafeModeIndicatorProps {
  appName: string;
}

export function SafeModeIndicator({ appName }: SafeModeIndicatorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <ShieldCheck size={20} color="#f59e0b" />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>🛡️ Safe Mode Active</Text>
        <Text style={styles.description}>
          Monitoring paused while you use {appName}. Session will resume automatically when you
          exit.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: SPACING.md,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde047',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },

  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fde047',
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    flex: 1,
    gap: 4,
  },

  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400e',
  },

  description: {
    fontSize: 11,
    color: '#78350f',
    lineHeight: 16,
  },
});
