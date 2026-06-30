// Exam Selection Screen
import { RADIUS, SPACING } from '@/src/constants/spacing';
import { authService } from '@/src/services/authService';
import { useAuthStore } from '@/src/store/authStore';
import { useTheme } from '@/src/theme';
import type { ThemeColors } from '@/src/theme';
import { router } from 'expo-router';
import { CheckCircle, ChevronRight } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

interface Exam {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

const EXAMS: Exam[] = [
  {
    id: 'upsc',
    name: 'UPSC',
    description: 'Union Public Service Commission',
    icon: '🏛️',
    color: '#3b82f6',
  },
  {
    id: 'jee',
    name: 'JEE',
    description: 'Joint Entrance Examination',
    icon: '🔬',
    color: '#8b5cf6',
  },
  {
    id: 'neet',
    name: 'NEET',
    description: 'National Eligibility cum Entrance Test',
    icon: '🏥',
    color: '#ec4899',
  },
  {
    id: 'gate',
    name: 'GATE',
    description: 'Graduate Aptitude Test in Engineering',
    icon: '⚙️',
    color: '#f59e0b',
  },
  {
    id: 'ssc',
    name: 'SSC',
    description: 'Staff Selection Commission',
    icon: '📚',
    color: '#10b981',
  },
  {
    id: 'banking',
    name: 'Banking',
    description: 'Banking & Financial Exams',
    icon: '🏦',
    color: '#06b6d4',
  },
  {
    id: 'cat',
    name: 'CAT',
    description: 'Common Admission Test',
    icon: '📊',
    color: '#f97316',
  },
  {
    id: 'other',
    name: 'Other',
    description: 'Custom exam or course',
    icon: '✏️',
    color: '#6366f1',
  },
];

export default function ExamSelectionScreen() {
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((state) => state.user);

  const handleContinue = async () => {
    if (!selectedExam || !user) return;

    setLoading(true);
    try {
      const exam = EXAMS.find((e) => e.id === selectedExam);
      if (!exam) return;

      // Update user profile in Firebase
      await authService.updateUserProfile(user.userId, {
        exam: exam.id,
        examName: exam.name,
      });

      // Navigate to subject selection
      router.replace({
        pathname: '/auth/subject-selection' as any,
        params: { examId: selectedExam },
      });
    } catch (error: any) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to save exam selection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderExamCard = ({ item }: { item: Exam }) => (
    <Pressable
      style={({ pressed }: { pressed: boolean }) => [
        styles.examCard,
        selectedExam === item.id && styles.examCardSelected,
        pressed && styles.examCardPressed,
      ]}
      onPress={() => setSelectedExam(item.id)}
    >
      <View style={styles.examCardContent}>
        <View
          style={[
            styles.examIcon,
            { backgroundColor: `${item.color}20` },
          ]}
        >
          <Text style={styles.emoji}>{item.icon}</Text>
        </View>
        <View style={styles.examInfo}>
          <Text style={styles.examName}>{item.name}</Text>
          <Text style={styles.examDesc}>{item.description}</Text>
        </View>
      </View>
      {selectedExam === item.id && (
        <CheckCircle size={24} color={COLORS.primary} />
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
          <Text style={styles.title}>Select Your Exam</Text>
          <Text style={styles.subtitle}>
            Choose the exam you&apos;re preparing for
          </Text>
        </View>

        {/* Exam List */}
        <FlatList
          data={EXAMS}
          renderItem={renderExamCard}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.examList}
        />
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomSection}>
        <Pressable
          style={({ pressed }: { pressed: boolean }) => [
            styles.continueBtn,
            !selectedExam && styles.continueBtnDisabled,
            pressed && styles.continueBtnPressed,
          ]}
          onPress={handleContinue}
          disabled={!selectedExam || loading}
        >
          <Text style={styles.continueBtnText}>
            {loading ? 'Loading...' : 'Continue'}
          </Text>
          <ChevronRight size={20} color={COLORS.background} />
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
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

  // Exam List
  examList: {
    gap: SPACING.md,
  },
  examCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  examCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(20,184,166,0.08)',
  },
  examCardPressed: {
    opacity: 0.7,
  },
  examCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  examIcon: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 28,
  },
  examInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  examName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  examDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
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
});
