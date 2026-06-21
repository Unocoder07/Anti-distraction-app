// Route: "/focus" → FocusSession (nav hidden on this screen)
import {
  FocusTimer,
  SessionControls,
  SessionStats,
  SubjectStats,
  TimeAdjuster,
  useFocusStore,
} from "@/src/components/focus";
import { COLORS } from "@/src/constants/colors";
import { RADIUS, SPACING } from "@/src/constants/spacing";
import { focusService } from "@/src/services/focusService";
import { nativeBlockingService } from "@/src/services/nativeBlockingService";
import { storage, STORAGE_KEYS } from "@/src/services/storage";
import { useAuthStore } from "@/src/store/authStore";
import { useHomeStore } from "@/src/store/homeStore";
import type { Subject } from "@/src/types";
import { router } from "expo-router";
import { BarChart3, Plus, X } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const DEFAULT_SUBJECTS: Subject[] = [
  { id: "1", name: "History", icon: "📜", color: "#8b5cf6" },
  { id: "2", name: "Geography", icon: "🗺️", color: "#06b6d4" },
  { id: "3", name: "Polity", icon: "⚖️", color: "#f59e0b" },
  { id: "4", name: "Economics", icon: "💹", color: "#10b981" },
  { id: "5", name: "Science", icon: "🔬", color: "#ec4899" },
  { id: "6", name: "Mathematics", icon: "📐", color: "#3b82f6" },
];

const SUBJECT_ICONS = [
  "📚",
  "✏️",
  "🎓",
  "📖",
  "🧮",
  "🔬",
  "🌍",
  "⚖️",
  "💡",
  "🎨",
  "🎵",
  "💻",
];
const SUBJECT_COLORS = [
  "#8b5cf6",
  "#06b6d4",
  "#f59e0b",
  "#10b981",
  "#ec4899",
  "#3b82f6",
  "#ef4444",
  "#f97316",
  "#84cc16",
  "#14b8a6",
  "#6366f1",
  "#a855f7",
];

export default function FocusScreen() {
  const {
    isActive,
    timeLeft,
    totalSeconds,
    cyclesCompleted,
    totalCycles,
    elapsedSeconds,
    coinsEarnedThisSession,
    streak,
    phase,
    subjectStudyData,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    tickSecond,
    loadSubjectData,
  } = useFocusStore();

  const { user } = useAuthStore();
  const { refreshHomeData } = useHomeStore();

  const [showSubjectSelect, setShowSubjectSelect] = useState(phase === "idle");
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [customSubjects, setCustomSubjects] = useState<Subject[]>([]);
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [backendSessionId, setBackendSessionId] = useState<string | null>(null);
  const [distractionCount, setDistractionCount] = useState(0);
  const [pauseCountState, setPauseCountState] = useState(0);

  // Add subject form
  const [newSubjectName, setNewSubjectName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(SUBJECT_ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(SUBJECT_COLORS[0]);

  // Load custom subjects and study data on mount
  useEffect(() => {
    void (async () => {
      const saved = await storage.load<Subject[]>(STORAGE_KEYS.CUSTOM_SUBJECTS);
      if (saved) {
        setCustomSubjects(saved);
      }
      await loadSubjectData();
    })();
  }, [loadSubjectData]);

  const saveCustomSubjects = async (subjects: Subject[]) => {
    await storage.save(STORAGE_KEYS.CUSTOM_SUBJECTS, subjects);
    setCustomSubjects(subjects);
  };

  // Tick every second when active
  useEffect(() => {
    if (!isActive || !sessionStarted) return;
    const id = setInterval(tickSecond, 1000);
    return () => clearInterval(id);
  }, [isActive, sessionStarted, tickSecond]);

  const handleCompleteSession = useCallback(async () => {
    if (!backendSessionId || !user) return;

    try {
      const actualDuration = Math.floor(elapsedSeconds / 60);
      const { fp, xp } = await focusService.completeFocusSession(
        backendSessionId,
        user.userId,
        actualDuration,
        cyclesCompleted,
        distractionCount,
        pauseCountState,
      );

      await nativeBlockingService.promptToDisableAfterSession();

      Alert.alert(
        "🎉 Session Complete!",
        `Great work! You earned:\n\n+${fp} Focus Points\n+${xp} XP\n\nKeep up the momentum!`,
        [
          {
            text: "Awesome!",
            onPress: async () => {
              await refreshHomeData(user.userId);
              router.push("/" as any);
            },
          },
        ],
      );

      setBackendSessionId(null);
      setDistractionCount(0);
      setPauseCountState(0);
    } catch (error) {
      console.error("Error completing session:", error);
      await nativeBlockingService.promptToDisableAfterSession();
      Alert.alert("Error", "Failed to save session. Please try again.");
      router.push("/" as any);
    }
  }, [
    backendSessionId,
    cyclesCompleted,
    distractionCount,
    elapsedSeconds,
    pauseCountState,
    refreshHomeData,
    user,
  ]);

  useEffect(() => {
    if (phase !== "done" || !backendSessionId || !user) {
      return;
    }

    const timeoutId = setTimeout(() => {
      void handleCompleteSession();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [backendSessionId, handleCompleteSession, phase, user]);

  const handleStartWithSubject = async (subject: Subject) => {
    if (!user) {
      Alert.alert("Error", "Please log in to start a session");
      return;
    }

    try {
      setSelectedSubject(subject);
      setShowSubjectSelect(false);

      const durationSeconds = durationMinutes * 60;

      const session = await focusService.startFocusSession(
        user.userId,
        durationMinutes,
        totalCycles,
        {
          id: subject.id,
          name: subject.name,
          icon: subject.icon,
          color: subject.color,
        },
      );

      startSession(durationSeconds, totalCycles, subject);
      pauseSession();
      setSessionStarted(true);
      setBackendSessionId(session.id);
      setDistractionCount(0);
      setPauseCountState(0);
    } catch (error) {
      console.error("Error starting session:", error);
      Alert.alert("Error", "Failed to start session. Please try again.");
      stopSession();
      setSessionStarted(false);
      setSelectedSubject(null);
      setShowSubjectSelect(true);
    }
  };

  const handleStop = async () => {
    if (backendSessionId && user) {
      try {
        const actualDuration = Math.floor(elapsedSeconds / 60);
        await focusService.breakFocusSession(
          backendSessionId,
          user.userId,
          actualDuration,
        );

        Alert.alert(
          "Session Ended",
          "You ended the session early. No rewards earned.",
          [{ text: "OK" }],
        );
      } catch (error) {
        console.error("Error breaking session:", error);
      } finally {
        await nativeBlockingService.promptToDisableAfterSession();
      }
    }

    stopSession();
    setSessionStarted(false);
    setSelectedSubject(null);
    setBackendSessionId(null);
    setDistractionCount(0);
    setPauseCountState(0);
    router.push("/" as any);
  };

  const handlePlayPause = async () => {
    if (isActive) {
      pauseSession();
      setPauseCountState((prev) => prev + 1);

      // Update pause in backend
      if (backendSessionId) {
        await focusService.pauseFocusSession(backendSessionId);
      }
    } else {
      resumeSession();

      // Resume in backend
      if (backendSessionId) {
        await focusService.resumeFocusSession(backendSessionId);
      }
    }
  };

  const handleAddSubject = () => {
    if (!newSubjectName.trim()) {
      // Silently return if name is empty
      return;
    }

    const newSubject: Subject = {
      id: `custom-${Date.now()}`,
      name: newSubjectName.trim(),
      icon: selectedIcon,
      color: selectedColor,
      isCustom: true,
    };

    const updated = [...customSubjects, newSubject];
    saveCustomSubjects(updated);

    setNewSubjectName("");
    setSelectedIcon(SUBJECT_ICONS[0]);
    setSelectedColor(SUBJECT_COLORS[0]);
    setShowAddSubject(false);
  };

  const handleIncreaseDuration = () => {
    setDurationMinutes((prev) => Math.min(prev + 5, 120));
  };

  const handleDecreaseDuration = () => {
    setDurationMinutes((prev) => Math.max(prev - 5, 5));
  };

  const allSubjects = [...DEFAULT_SUBJECTS, ...customSubjects];

  return (
    <View style={styles.screen}>
      {/* Ambient glow */}
      <View
        style={[styles.glow, isActive ? styles.glowTeal : styles.glowOrange]}
      />

      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable style={styles.closeBtn} onPress={handleStop}>
          <X size={20} color={COLORS.textSecondary} />
        </Pressable>
        <View style={styles.topCenter}>
          {selectedSubject && (
            <View
              style={[
                styles.subjectBadge,
                { borderColor: selectedSubject.color },
              ]}
            >
              <Text style={styles.subjectIcon}>{selectedSubject.icon}</Text>
              <Text style={styles.subjectName}>{selectedSubject.name}</Text>
            </View>
          )}
          <Text
            style={[
              styles.modeLabel,
              { color: isActive ? COLORS.primary : "#f97316" },
            ]}
          >
            {phase === "done"
              ? "Session Complete!"
              : isActive
                ? "Deep Work Mode"
                : sessionStarted
                  ? "Ready to Start"
                  : "Deep Work Mode"}
          </Text>
          <Text style={styles.phaseLabel}>
            Phase {Math.min(cyclesCompleted + 1, totalCycles)} / {totalCycles}
          </Text>
        </View>
        <Pressable style={styles.statsBtn} onPress={() => setShowStats(true)}>
          <BarChart3 size={20} color={COLORS.textSecondary} />
        </Pressable>
      </View>

      {/* Timer ring */}
      <FocusTimer
        timeLeft={timeLeft}
        totalSeconds={totalSeconds}
        isActive={isActive}
        modeLabel=""
        label={phase === "done" ? "Complete" : "Remaining"}
      />

      {/* Ready to start message */}
      {sessionStarted &&
        !isActive &&
        phase === "focus" &&
        elapsedSeconds === 0 && (
          <View style={styles.readyMessage}>
            <Text style={styles.readyText}>Press Play to Begin</Text>
            <Text style={styles.readyHint}>Your timer is ready</Text>
          </View>
        )}

      {/* Session stats */}
      <View style={styles.statsWrap}>
        <SessionStats
          stats={{
            elapsedSeconds,
            cyclesCompleted,
            totalCycles,
            coinsEarned: coinsEarnedThisSession,
            streak,
          }}
        />
      </View>

      {/* Controls */}
      <SessionControls
        isActive={isActive}
        onPlayPause={handlePlayPause}
        onStop={handleStop}
        onShield={() => {}}
        debugLabel="Simulate App Interruption"
        onDebug={() => {}}
      />

      {/* Subject Selection Modal */}
      <Modal
        visible={showSubjectSelect}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowSubjectSelect(false);
          router.push("/" as any);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Start Focus Session</Text>
              <Pressable
                onPress={() => {
                  setShowSubjectSelect(false);
                  router.push("/" as any);
                }}
                hitSlop={8}
              >
                <X size={20} color={COLORS.textSecondary} />
              </Pressable>
            </View>

            {/* Time Adjuster */}
            <View style={styles.timeSection}>
              <TimeAdjuster
                durationMinutes={durationMinutes}
                onIncrease={handleIncreaseDuration}
                onDecrease={handleDecreaseDuration}
              />
            </View>

            <Text style={styles.modalSubtitle}>
              Choose a subject to focus on
            </Text>

            {/* Subject Grid */}
            <ScrollView
              style={styles.subjectScroll}
              contentContainerStyle={styles.subjectGrid}
              showsVerticalScrollIndicator={false}
            >
              {allSubjects.map((subject) => (
                <Pressable
                  key={subject.id}
                  style={({ pressed }) => [
                    styles.subjectCard,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => handleStartWithSubject(subject)}
                >
                  <View
                    style={[
                      styles.subjectIconBox,
                      { backgroundColor: `${subject.color}20` },
                    ]}
                  >
                    <Text style={styles.subjectCardIcon}>{subject.icon}</Text>
                  </View>
                  <Text style={styles.subjectCardName}>{subject.name}</Text>
                  {subject.isCustom && (
                    <Text style={styles.customBadge}>Custom</Text>
                  )}
                  <View
                    style={[
                      styles.startIndicator,
                      { backgroundColor: subject.color },
                    ]}
                  >
                    <Text style={styles.startText}>Start</Text>
                  </View>
                </Pressable>
              ))}

              {/* Add Subject Card */}
              <Pressable
                style={({ pressed }) => [
                  styles.subjectCard,
                  styles.addCard,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => setShowAddSubject(true)}
              >
                <View style={styles.addIconBox}>
                  <Plus size={32} color={COLORS.primary} />
                </View>
                <Text style={styles.addCardText}>Add Subject</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Subject Modal */}
      <Modal
        visible={showAddSubject}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddSubject(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.addSubjectModal]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Custom Subject</Text>
              <Pressable onPress={() => setShowAddSubject(false)} hitSlop={8}>
                <X size={20} color={COLORS.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Subject Name</Text>
              <TextInput
                style={styles.input}
                value={newSubjectName}
                onChangeText={setNewSubjectName}
                placeholder="e.g., Biology, Physics, etc."
                placeholderTextColor={COLORS.textSecondary}
                maxLength={20}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Choose Icon</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.iconGrid}
              >
                {SUBJECT_ICONS.map((icon) => (
                  <Pressable
                    key={icon}
                    style={[
                      styles.iconOption,
                      selectedIcon === icon && styles.iconOptionSelected,
                    ]}
                    onPress={() => setSelectedIcon(icon)}
                  >
                    <Text style={styles.iconOptionText}>{icon}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Choose Color</Text>
              <View style={styles.colorGrid}>
                {SUBJECT_COLORS.map((color) => (
                  <Pressable
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setSelectedColor(color)}
                  />
                ))}
              </View>
            </View>

            <Pressable style={styles.addButton} onPress={handleAddSubject}>
              <Text style={styles.addButtonText}>Add Subject</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Stats Modal */}
      <Modal
        visible={showStats}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStats(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Study Statistics</Text>
              <Pressable onPress={() => setShowStats(false)} hitSlop={8}>
                <X size={20} color={COLORS.textSecondary} />
              </Pressable>
            </View>
            <SubjectStats subjectData={subjectStudyData} />
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
    alignItems: "center",
  },
  glow: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    top: "25%",
    alignSelf: "center",
    opacity: 0.12,
  },
  glowTeal: { backgroundColor: COLORS.primary },
  glowOrange: { backgroundColor: "#f97316" },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 52,
    marginBottom: 8,
  },
  closeBtn: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  statsBtn: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  topCenter: { alignItems: "center", gap: 4 },
  subjectBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 4,
  },
  subjectIcon: {
    fontSize: 14,
  },
  subjectName: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
  },
  modeLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  phaseLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },

  readyMessage: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  readyText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f97316",
    marginBottom: 4,
  },
  readyHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  statsWrap: {
    width: "100%",
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 32,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  timeSection: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  subjectScroll: {
    maxHeight: 400,
  },
  subjectGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
  },
  subjectCard: {
    width: "47%",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: "center",
    gap: SPACING.sm,
    minHeight: 140,
    justifyContent: "center",
  },
  subjectIconBox: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
  },
  subjectCardIcon: {
    fontSize: 28,
  },
  subjectCardName: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
  },
  customBadge: {
    fontSize: 9,
    color: COLORS.primary,
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  startIndicator: {
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginTop: SPACING.xs,
  },
  startText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  addCard: {
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  addIconBox: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${COLORS.primary}20`,
  },
  addCardText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
  },

  // Add Subject Modal
  addSubjectModal: {
    maxHeight: "70%",
  },
  formSection: {
    marginBottom: SPACING.lg,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 15,
    color: COLORS.text,
  },
  iconGrid: {
    gap: SPACING.sm,
  },
  iconOption: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
  },
  iconOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}20`,
  },
  iconOptionText: {
    fontSize: 24,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorOptionSelected: {
    borderColor: COLORS.text,
    borderWidth: 3,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: "center",
    marginTop: SPACING.md,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});
