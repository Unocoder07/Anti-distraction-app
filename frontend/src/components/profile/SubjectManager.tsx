// Subject Manager Component
import { COLORS } from '@/src/constants/colors';
import { RADIUS, SPACING } from '@/src/constants/spacing';
import { CheckCircle, Edit2, Plus, Trash2, X } from 'lucide-react-native';
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

export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  isActive: boolean;
}

interface SubjectManagerProps {
  subjects: Subject[];
  onSubjectsChange: (subjects: Subject[]) => void;
}

const SUBJECT_ICONS = ['📚', '🔬', '📐', '🧪', '⚛️', '🧬', '📖', '🗺️', '⚖️', '💹', '📰', '🏛️'];
const SUBJECT_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#f97316',
  '#6366f1',
  '#14b8a6',
  '#a78bfa',
];

export function SubjectManager({ subjects, onSubjectsChange }: SubjectManagerProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectName, setSubjectName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(SUBJECT_ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(SUBJECT_COLORS[0]);

  const handleAddSubject = () => {
    if (!subjectName.trim()) return;

    const newSubject: Subject = {
      id: `subject-${Date.now()}`,
      name: subjectName,
      icon: selectedIcon,
      color: selectedColor,
      isActive: true,
    };

    onSubjectsChange([...subjects, newSubject]);
    resetForm();
    setShowAddModal(false);
  };

  const handleUpdateSubject = () => {
    if (!subjectName.trim() || !editingSubject) return;

    const updated = subjects.map((s) =>
      s.id === editingSubject.id
        ? { ...s, name: subjectName, icon: selectedIcon, color: selectedColor }
        : s
    );

    onSubjectsChange(updated);
    resetForm();
    setShowEditModal(false);
  };

  const handleDeleteSubject = (id: string) => {
    onSubjectsChange(subjects.filter((s) => s.id !== id));
  };

  const handleToggleActive = (id: string) => {
    const updated = subjects.map((s) =>
      s.id === id ? { ...s, isActive: !s.isActive } : s
    );
    onSubjectsChange(updated);
  };

  const openEditModal = (subject: Subject) => {
    setEditingSubject(subject);
    setSubjectName(subject.name);
    setSelectedIcon(subject.icon);
    setSelectedColor(subject.color);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setSubjectName('');
    setSelectedIcon(SUBJECT_ICONS[0]);
    setSelectedColor(SUBJECT_COLORS[0]);
    setEditingSubject(null);
  };

  const renderSubjectCard = ({ item }: { item: Subject }) => (
    <View
      style={[
        styles.subjectCard,
        !item.isActive && styles.subjectCardInactive,
      ]}
    >
      <View style={styles.subjectLeft}>
        <View
          style={[
            styles.subjectIcon,
            { backgroundColor: `${item.color}20` },
          ]}
        >
          <Text style={styles.emoji}>{item.icon}</Text>
        </View>
        <View style={styles.subjectInfo}>
          <Text
            style={[
              styles.subjectName,
              !item.isActive && styles.subjectNameInactive,
            ]}
          >
            {item.name}
          </Text>
          <Text style={styles.subjectStatus}>
            {item.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <View style={styles.subjectActions}>
        <Pressable
          onPress={() => handleToggleActive(item.id)}
          hitSlop={8}
        >
          <CheckCircle
            size={20}
            color={item.isActive ? COLORS.primary : COLORS.textSecondary}
          />
        </Pressable>
        <Pressable
          onPress={() => openEditModal(item)}
          hitSlop={8}
        >
          <Edit2 size={18} color={COLORS.textSecondary} />
        </Pressable>
        <Pressable
          onPress={() => handleDeleteSubject(item.id)}
          hitSlop={8}
        >
          <Trash2 size={18} color={COLORS.danger} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Subjects</Text>
        <Pressable
          style={({ pressed }: { pressed: boolean }) => [
            styles.addBtn,
            pressed && { opacity: 0.7 },
          ]}
          onPress={() => {
            resetForm();
            setShowAddModal(true);
          }}
        >
          <Plus size={18} color={COLORS.primary} />
        </Pressable>
      </View>

      {/* Subject List */}
      {subjects.length > 0 ? (
        <FlatList
          data={subjects}
          renderItem={renderSubjectCard}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.subjectList}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateEmoji}>📚</Text>
          <Text style={styles.emptyStateText}>No subjects added yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Add subjects to organize your study
          </Text>
        </View>
      )}

      {/* Add Subject Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SubjectModal
          title="Add Subject"
          subjectName={subjectName}
          onNameChange={setSubjectName}
          selectedIcon={selectedIcon}
          onIconSelect={setSelectedIcon}
          selectedColor={selectedColor}
          onColorSelect={setSelectedColor}
          onConfirm={handleAddSubject}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* Edit Subject Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <SubjectModal
          title="Edit Subject"
          subjectName={subjectName}
          onNameChange={setSubjectName}
          selectedIcon={selectedIcon}
          onIconSelect={setSelectedIcon}
          selectedColor={selectedColor}
          onColorSelect={setSelectedColor}
          onConfirm={handleUpdateSubject}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>
    </View>
  );
}

// Subject Modal Component
interface SubjectModalProps {
  title: string;
  subjectName: string;
  onNameChange: (name: string) => void;
  selectedIcon: string;
  onIconSelect: (icon: string) => void;
  selectedColor: string;
  onColorSelect: (color: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

function SubjectModal({
  title,
  subjectName,
  onNameChange,
  selectedIcon,
  onIconSelect,
  selectedColor,
  onColorSelect,
  onConfirm,
  onCancel,
}: SubjectModalProps) {
  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Pressable onPress={onCancel} hitSlop={8}>
            <X size={20} color={COLORS.textSecondary} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Subject Name */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Subject Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter subject name"
              placeholderTextColor={COLORS.textSecondary}
              value={subjectName}
              onChangeText={onNameChange}
              autoFocus
            />
          </View>

          {/* Icon Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Choose Icon</Text>
            <View style={styles.iconGrid}>
              {SUBJECT_ICONS.map((icon) => (
                <Pressable
                  key={icon}
                  style={[
                    styles.iconOption,
                    selectedIcon === icon && styles.iconOptionSelected,
                  ]}
                  onPress={() => onIconSelect(icon)}
                >
                  <Text style={styles.iconOptionEmoji}>{icon}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Color Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Choose Color</Text>
            <View style={styles.colorGrid}>
              {SUBJECT_COLORS.map((color) => (
                <Pressable
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => onColorSelect(color)}
                >
                  {selectedColor === color && (
                    <CheckCircle size={20} color="#fff" />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Buttons */}
        <View style={styles.modalButtons}>
          <Pressable
            style={({ pressed }: { pressed: boolean }) => [
              styles.modalBtn,
              styles.modalBtnCancel,
              pressed && { opacity: 0.7 },
            ]}
            onPress={onCancel}
          >
            <Text style={styles.modalBtnCancelText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={({ pressed }: { pressed: boolean }) => [
              styles.modalBtn,
              styles.modalBtnConfirm,
              pressed && { opacity: 0.85 },
            ]}
            onPress={onConfirm}
            disabled={!subjectName.trim()}
          >
            <Text style={styles.modalBtnConfirmText}>Confirm</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Subject List
  subjectList: {
    gap: SPACING.md,
  },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  subjectCardInactive: {
    opacity: 0.6,
  },
  subjectLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  subjectIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 20,
  },
  subjectInfo: {
    gap: SPACING.xs,
  },
  subjectName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  subjectNameInactive: {
    color: COLORS.textSecondary,
  },
  subjectStatus: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  subjectActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.md,
  },
  emptyStateEmoji: {
    fontSize: 48,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  modalContent: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },

  // Sections
  section: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 14,
    color: COLORS.text,
  },

  // Icon Grid
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  iconOption: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(20,184,166,0.1)',
  },
  iconOptionEmoji: {
    fontSize: 24,
  },

  // Color Grid
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  colorOption: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#fff',
  },

  // Modal Buttons
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
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
  modalBtnConfirm: {
    backgroundColor: COLORS.primary,
  },
  modalBtnConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.background,
  },
});
