/**
 * DurationPicker - Time Selection Component
 */

import { COLORS } from '@/src/constants/colors';
import { RADIUS, SPACING } from '@/src/constants/spacing';
import { Clock } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface DurationPickerProps {
  selected: number; // minutes
  onSelect: (minutes: number) => void;
}

const PRESET_DURATIONS = [
  { label: '10 min', value: 10 },
  { label: '20 min', value: 20 },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
];

export function DurationPicker({ selected, onSelect }: DurationPickerProps) {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');

  const handleCustomSubmit = () => {
    const minutes = parseInt(customMinutes, 10);
    if (minutes > 0 && minutes <= 300) {
      onSelect(minutes);
      setShowCustomModal(false);
      setCustomMinutes('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Clock size={16} color={COLORS.primary} />
        <Text style={styles.title}>Focus Duration</Text>
      </View>

      <View style={styles.grid}>
        {PRESET_DURATIONS.map((duration) => (
          <Pressable
            key={duration.value}
            style={({ pressed }) => [
              styles.option,
              selected === duration.value && styles.optionSelected,
              pressed && styles.optionPressed,
            ]}
            onPress={() => onSelect(duration.value)}
          >
            <Text
              style={[
                styles.optionText,
                selected === duration.value && styles.optionTextSelected,
              ]}
            >
              {duration.label}
            </Text>
          </Pressable>
        ))}

        <Pressable
          style={({ pressed }) => [
            styles.option,
            styles.customOption,
            pressed && styles.optionPressed,
          ]}
          onPress={() => setShowCustomModal(true)}
        >
          <Text style={styles.customOptionText}>Custom</Text>
        </Pressable>
      </View>

      {/* Custom Duration Modal */}
      <Modal
        visible={showCustomModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCustomModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowCustomModal(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Custom Duration</Text>
            <Text style={styles.modalDesc}>Enter duration in minutes (1-300)</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter minutes"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="number-pad"
              value={customMinutes}
              onChangeText={setCustomMinutes}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={styles.modalButton}
                onPress={() => setShowCustomModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleCustomSubmit}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                  Set
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  option: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 80,
    alignItems: 'center',
  },
  optionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionPressed: {
    opacity: 0.7,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  optionTextSelected: {
    color: '#fff',
  },

  customOption: {
    borderStyle: 'dashed',
  },
  customOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  modalButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: COLORS.primary,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalButtonTextPrimary: {
    color: '#fff',
  },
});
