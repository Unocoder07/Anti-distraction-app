// Subject Selection Screen
import { COLORS } from '@/src/constants/colors';
import { RADIUS, SPACING } from '@/src/constants/spacing';
import { authService } from '@/src/services/authService';
import { useAuthStore } from '@/src/store/authStore';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle, Plus, X } from 'lucide-react-native';
import { useState } from 'react';
import {
    FlatList,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const EXAM_SUBJECTS: Record<string, Subject[]> = {
  upsc: [
    { id: 'history', name: 'History', icon: '📜', color: '#8b5cf6' },
    { id: 'geography', name: 'Geography', icon: '🗺️', color: '#06b6d4' },
    { id: 'polity', name: 'Polity', icon: '⚖️', color: '#f59e0b' },
    { id: 'economics', name: 'Economics', icon: '💹', color: '#10b981' },
    { id: 'science', name: 'Science', icon: '🔬', color: '#ec4899' },
    { id: 'current', name: 'Current Affairs', icon: '📰', color: '#3b82f6' },
  ],
  jee: [
    { id: 'physics', name: 'Physics', icon: '⚛️', color: '#3b82f6' },
    { id: 'chemistry', name: 'Chemistry', icon: '🧪', color: '#10b981' },
    { id: 'maths', name: 'Mathematics', icon: '📐', color: '#f59e0b' },
  ],
  neet: [
    { id: 'biology', name: 'Biology', icon: '🧬', color: '#ec4899' },
    { id: 'physics', name: 'Physics', icon: '⚛️', color: '#3b82f6' },
    { id: 'chemistry', name: 'Chemistry', icon: '🧪', color: '#10b981' },
  ],
  gate: [
    { id: 'cse', name: 'Computer Science', icon: '💻', color: '#3b82f6' },
    { id: 'mechanical', name: 'Mechanical', icon: '⚙️', color: '#f59e0b' },
    { id: 'civil', name: 'Civil', icon: '🏗️', color: '#8b5cf6' },
    { id: 'electrical', name: 'Electrical', icon: '⚡', color: '#facc15' },
  ],
  ssc: [
    { id: 'english', name: 'English', icon: '📖', color: '#3b82f6' },
    { id: 'hindi', name: 'Hindi', icon: '🇮🇳', color: '#f97316' },
    { id: 'maths', name: 'Mathematics', icon: '📐', color: '#f59e0b' },
    { id: 'reasoning', name: 'Reasoning', icon: '🧠', color: '#8b5cf6' },
    { id: 'gk', name: 'General Knowledge', icon: '🌍', color: '#10b981' },
  ],
  banking: [
    { id: 'english', name: 'English', icon: '📖', color: '#3b82f6' },
    { id: 'quantitative', name: 'Quantitative Aptitude', icon: '📊', color: '#f59e0b' },
    { id: 'reasoning', name: 'Reasoning', icon: '🧠', color: '#8b5cf6' },
    { id: 'banking', name: 'Banking Awareness', icon: '🏦', color: '#06b6d4' },
  ],
  cat: [
    { id: 'verbal', name: 'Verbal Ability', icon: '📝', color: '#3b82f6' },
    { id: 'quant', name: 'Quantitative', icon: '📊', color: '#f59e0b' },
    { id: 'logical', name: 'Logical Reasoning', icon: '🧠', color: '#8b5cf6' },
  ],
  other: [],
};

export default function SubjectSelectionScreen() {
  const { examId } = useLocalSearchParams<{ examId: string }>();
  const user = useAuthStore((state) => state.user);
  const refreshUserProfile = useAuthStore((state) => state.refreshUserProfile);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [customSubject, setCustomSubject] = useState('');
  const [customSubjects, setCustomSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);

  const availableSubjects = EXAM_SUBJECTS[examId || 'upsc'] || [];
  const allSubjects = [...availableSubjects, ...customSubjects];

  const toggleSubject = (id: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleAddCustomSubject = () => {
    if (!customSubject.trim()) return;

    const newSubject: Subject = {
      id: `custom-${Date.now()}`,
      name: customSubject,
      icon: '📚',
      color: '#6366f1',
    };

    setCustomSubjects((prev) => [...prev, newSubject]);
    setSelectedSubjects((prev) => [...prev, newSubject.id]);
    setCustomSubject('');
    setShowAddModal(false);
  };

  const handleContinue = async () => {
    if (selectedSubjects.length === 0 || !user) return;

    setLoading(true);
    try {
      const subjectNames = allSubjects
        .filter((s) => selectedSubjects.includes(s.id))
        .map((s) => s.name);

      await authService.updateUserProfile(user.userId, { subjects: subjectNames });
      await refreshUserProfile();

      router.replace('/(tabs)' as any);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderSubjectCard = ({ item }: { item: Subject }) => (
    <Pressable
      style={({ pressed }: { pressed: boolean }) => [
        styles.subjectCard,
        selectedSubjects.includes(item.id) && styles.subjectCardSelected,
        pressed && styles.subjectCardPressed,
      ]}
      onPress={() => toggleSubject(item.id)}
    >
      <View
        style={[
          styles.subjectIcon,
          { backgroundColor: `${item.color}20` },
        ]}
      >
        <Text style={styles.emoji}>{item.icon}</Text>
      </View>
      <Text style={styles.subjectName}>{item.name}</Text>
      {selectedSubjects.includes(item.id) && (
        <CheckCircle size={20} color={COLORS.primary} />
      )}
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Select Subjects</Text>
          <Text style={styles.subtitle}>
            Choose subjects you want to focus on
          </Text>
        </View>

        {/* Subject Grid */}
        <FlatList
          data={allSubjects}
          renderItem={renderSubjectCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          scrollEnabled={false}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.subjectGrid}
        />

        {/* Add Custom Subject Button */}
        <Pressable
          style={({ pressed }: { pressed: boolean }) => [
            styles.addSubjectBtn,
            pressed && { opacity: 0.7 },
          ]}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={20} color={COLORS.primary} />
          <Text style={styles.addSubjectText}>Add Custom Subject</Text>
        </Pressable>

        {/* Selected Count */}
        {selectedSubjects.length > 0 && (
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedText}>
              {selectedSubjects.length} subject{selectedSubjects.length !== 1 ? 's' : ''} selected
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomSection}>
        <Pressable
          style={({ pressed }: { pressed: boolean }) => [
            styles.continueBtn,
            selectedSubjects.length === 0 && styles.continueBtnDisabled,
            pressed && styles.continueBtnPressed,
          ]}
          onPress={handleContinue}
          disabled={selectedSubjects.length === 0 || loading}
        >
          <Text style={styles.continueBtnText}>
            {loading ? 'Setting up...' : 'Start Learning'}
          </Text>
        </Pressable>
      </View>

      {/* Add Subject Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Close Button */}
            <Pressable
              style={styles.modalCloseBtn}
              onPress={() => setShowAddModal(false)}
            >
              <X size={20} color={COLORS.textSecondary} />
            </Pressable>

            {/* Title */}
            <Text style={styles.modalTitle}>Add Custom Subject</Text>

            {/* Input */}
            <TextInput
              style={styles.modalInput}
              placeholder="Enter subject name"
              placeholderTextColor={COLORS.textSecondary}
              value={customSubject}
              onChangeText={setCustomSubject}
              autoFocus
            />

            {/* Buttons */}
            <View style={styles.modalButtons}>
              <Pressable
                style={({ pressed }: { pressed: boolean }) => [
                  styles.modalBtn,
                  styles.modalBtnCancel,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }: { pressed: boolean }) => [
                  styles.modalBtn,
                  styles.modalBtnAdd,
                  pressed && { opacity: 0.85 },
                ]}
                onPress={handleAddCustomSubject}
                disabled={!customSubject.trim()}
              >
                <Text style={styles.modalBtnAddText}>Add Subject</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },

  // Header
  header: {
    gap: SPACING.sm,
    marginBottom: SPACING.xxl,
    marginTop: SPACING.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  // Subject Grid
  subjectGrid: {
    gap: SPACING.md,
  },
  gridRow: {
    gap: SPACING.md,
  },
  subjectCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.sm,
    minHeight: 120,
    justifyContent: 'center',
  },
  subjectCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(20,184,166,0.08)',
  },
  subjectCardPressed: {
    opacity: 0.7,
  },
  subjectIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  subjectName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },

  // Add Subject Button
  addSubjectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    marginTop: SPACING.lg,
  },
  addSubjectText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Selected Info
  selectedInfo: {
    backgroundColor: 'rgba(20,184,166,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.2)',
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  selectedText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Bottom Section
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  continueBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    boxShadow: `0 0 16px ${COLORS.primary}5A`, // 0.35 opacity
    elevation: 6,
  },
  continueBtnDisabled: {
    opacity: 0.5,
  },
  continueBtnPressed: {
    opacity: 0.85,
  },
  continueBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.background,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  modalCloseBtn: {
    alignSelf: 'flex-end',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 14,
    color: COLORS.text,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  modalBtn: {
    flex: 1,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalBtnCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modalBtnAdd: {
    backgroundColor: COLORS.primary,
  },
  modalBtnAddText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.background,
  },
});
