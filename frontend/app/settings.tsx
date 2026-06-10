// Route: "/settings" → Settings Screen
import { COLORS } from '@/src/constants/colors';
import { RADIUS, SPACING } from '@/src/constants/spacing';
import { authService } from '@/src/services/authService';
import { useAuthStore } from '@/src/store/authStore';
import { router } from 'expo-router';
import {
    ArrowLeft,
    Bell,
    BookOpen,
    Camera,
    CheckCircle,
    ChevronRight,
    Edit2,
    Globe,
    Moon,
    Shield,
    User,
    Volume2,
    X
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View
} from 'react-native';

interface UserProfile {
  username: string;
  avatar: string;
  exam: string;
  examName: string;
  subjects: string[];
  joinedAt: string;
}

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

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
];

export default function SettingsScreen() {
  const { user, refreshUserProfile } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile>({
    username: 'Student #8492',
    avatar: AVATAR_OPTIONS[0],
    exam: 'upsc',
    examName: 'UPSC',
    subjects: [],
    joinedAt: 'Jan 2026',
  });

  // Modal states
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);

  // Form states
  const [tempUsername, setTempUsername] = useState('');
  const [tempAvatar, setTempAvatar] = useState('');
  const [tempExam, setTempExam] = useState('');

  // Settings states
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const saved = await authService.getUserProfile(user.userId);
      if (saved) {
        setProfile({
          username: saved.username,
          avatar: saved.avatar || AVATAR_OPTIONS[0],
          exam: saved.exam || 'upsc',
          examName: saved.examName || 'UPSC',
          subjects: saved.subjects || [],
          joinedAt: saved.joinedAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        });
      }
    } catch (error) {
      console.error('Settings: Error loading profile:', error);
    }
  };

  const saveProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    try {
      const updated = { ...profile, ...updates };
      await authService.updateUserProfile(user.userId, {
        username: updated.username,
        avatar: updated.avatar,
        exam: updated.exam,
        examName: updated.examName,
        subjects: updated.subjects,
      });
      await refreshUserProfile();
      setProfile(updated);
    } catch (error) {
      console.error('Settings: Error saving profile:', error);
    }
  };

  const handleAvatarChange = (avatar: string) => {
    saveProfile({ avatar });
    setShowAvatarModal(false);
  };

  const handleUsernameChange = () => {
    if (!tempUsername.trim()) return;
    saveProfile({ username: tempUsername.trim() });
    setShowUsernameModal(false);
    setTempUsername('');
  };

  const handleExamChange = (examId: string) => {
    const exam = EXAMS.find((e) => e.id === examId);
    if (exam) {
      saveProfile({ exam: examId, examName: exam.name });
      setShowExamModal(false);
    }
  };

  const openUsernameModal = () => {
    setTempUsername(profile.username);
    setShowUsernameModal(true);
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>

          {/* Avatar */}
          <Pressable style={styles.settingCard} onPress={() => setShowAvatarModal(true)}>
            <View style={styles.settingLeft}>
              <View style={styles.avatarContainer}>
                <Image source={{ uri: profile.avatar }} style={styles.avatar} />
                <View style={styles.cameraIcon}>
                  <Camera size={14} color={COLORS.background} />
                </View>
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Profile Picture</Text>
                <Text style={styles.settingValue}>Tap to change</Text>
              </View>
            </View>
            <ChevronRight size={20} color={COLORS.border} />
          </Pressable>

          {/* Username */}
          <Pressable style={styles.settingCard} onPress={openUsernameModal}>
            <View style={styles.settingLeft}>
              <View style={styles.iconBox}>
                <User size={18} color={COLORS.primary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Username</Text>
                <Text style={styles.settingValue}>{profile.username}</Text>
              </View>
            </View>
            <Edit2 size={18} color={COLORS.border} />
          </Pressable>

          {/* Exam Selection */}
          <Pressable style={styles.settingCard} onPress={() => setShowExamModal(true)}>
            <View style={styles.settingLeft}>
              <View style={styles.iconBox}>
                <Globe size={18} color={COLORS.primary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Target Exam</Text>
                <Text style={styles.settingValue}>{profile.examName}</Text>
              </View>
            </View>
            <ChevronRight size={20} color={COLORS.border} />
          </Pressable>

          {/* Subjects Management */}
          <Pressable
            style={styles.settingCard}
            onPress={() => router.push('/study-history' as any)}
          >
            <View style={styles.settingLeft}>
              <View style={styles.iconBox}>
                <BookOpen size={18} color={COLORS.primary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Manage Subjects</Text>
                <Text style={styles.settingValue}>View & edit your subjects</Text>
              </View>
            </View>
            <ChevronRight size={20} color={COLORS.border} />
          </Pressable>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          {/* Notifications */}
          <View style={styles.settingCard}>
            <View style={styles.settingLeft}>
              <View style={styles.iconBox}>
                <Bell size={18} color={COLORS.primary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Notifications</Text>
                <Text style={styles.settingValue}>
                  {notificationsEnabled ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.background}
            />
          </View>

          {/* Sound */}
          <View style={styles.settingCard}>
            <View style={styles.settingLeft}>
              <View style={styles.iconBox}>
                <Volume2 size={18} color={COLORS.primary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Sound Effects</Text>
                <Text style={styles.settingValue}>
                  {soundEnabled ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.background}
            />
          </View>

          {/* Haptics */}
          <View style={styles.settingCard}>
            <View style={styles.settingLeft}>
              <View style={styles.iconBox}>
                <Shield size={18} color={COLORS.primary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Haptic Feedback</Text>
                <Text style={styles.settingValue}>
                  {hapticsEnabled ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.background}
            />
          </View>

          {/* Dark Mode */}
          <View style={styles.settingCard}>
            <View style={styles.settingLeft}>
              <View style={styles.iconBox}>
                <Moon size={18} color={COLORS.primary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Dark Mode</Text>
                <Text style={styles.settingValue}>
                  {darkMode ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.background}
            />
          </View>
        </View>

        {/* App Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>Sankalai v1.0.0</Text>
          <Text style={styles.infoSubtext}>Focus. Learn. Achieve.</Text>
        </View>
      </ScrollView>

      {/* Avatar Selection Modal */}
      <Modal
        visible={showAvatarModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAvatarModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Profile Picture</Text>
              <Pressable onPress={() => setShowAvatarModal(false)} hitSlop={8}>
                <X size={20} color={COLORS.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.avatarGrid}
              showsVerticalScrollIndicator={false}
            >
              {AVATAR_OPTIONS.map((avatar, index) => (
                <Pressable
                  key={index}
                  style={[
                    styles.avatarOption,
                    profile.avatar === avatar && styles.avatarOptionSelected,
                  ]}
                  onPress={() => handleAvatarChange(avatar)}
                >
                  <Image source={{ uri: avatar }} style={styles.avatarOptionImage} />
                  {profile.avatar === avatar && (
                    <View style={styles.avatarCheckmark}>
                      <CheckCircle size={24} color={COLORS.primary} />
                    </View>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Username Edit Modal */}
      <Modal
        visible={showUsernameModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUsernameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.smallModal]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Username</Text>
              <Pressable onPress={() => setShowUsernameModal(false)} hitSlop={8}>
                <X size={20} color={COLORS.textSecondary} />
              </Pressable>
            </View>

            <TextInput
              style={styles.input}
              value={tempUsername}
              onChangeText={setTempUsername}
              placeholder="Enter username"
              placeholderTextColor={COLORS.textSecondary}
              maxLength={30}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setShowUsernameModal(false)}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnSave]}
                onPress={handleUsernameChange}
                disabled={!tempUsername.trim()}
              >
                <Text style={styles.modalBtnSaveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Exam Selection Modal */}
      <Modal
        visible={showExamModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowExamModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Target Exam</Text>
              <Pressable onPress={() => setShowExamModal(false)} hitSlop={8}>
                <X size={20} color={COLORS.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.examList}
              showsVerticalScrollIndicator={false}
            >
              {EXAMS.map((exam) => (
                <Pressable
                  key={exam.id}
                  style={[
                    styles.examCard,
                    profile.exam === exam.id && styles.examCardSelected,
                  ]}
                  onPress={() => handleExamChange(exam.id)}
                >
                  <View style={styles.examCardContent}>
                    <View
                      style={[
                        styles.examIcon,
                        { backgroundColor: `${exam.color}20` },
                      ]}
                    >
                      <Text style={styles.emoji}>{exam.icon}</Text>
                    </View>
                    <View style={styles.examInfo}>
                      <Text style={styles.examName}>{exam.name}</Text>
                      <Text style={styles.examDesc}>{exam.description}</Text>
                    </View>
                  </View>
                  {profile.exam === exam.id && (
                    <CheckCircle size={24} color={COLORS.primary} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  spacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  settingCard: {
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
  settingLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingInfo: {
    flex: 1,
    gap: 2,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  settingValue: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  infoSection: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  infoSubtext: {
    fontSize: 11,
    color: COLORS.textSecondary,
    opacity: 0.6,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '85%',
  },
  smallModal: {
    maxHeight: '40%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },

  // Avatar Grid
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  avatarOption: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  avatarOptionSelected: {
    borderColor: COLORS.primary,
  },
  avatarOptionImage: {
    width: '100%',
    height: '100%',
  },
  avatarCheckmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
  },

  // Input
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },

  // Modal Buttons
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
  modalBtnSave: {
    backgroundColor: COLORS.primary,
  },
  modalBtnSaveText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.background,
  },

  // Exam List
  examList: {
    gap: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  examCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  examCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}15`,
  },
  examCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  examIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  examInfo: {
    flex: 1,
    gap: 2,
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
});
