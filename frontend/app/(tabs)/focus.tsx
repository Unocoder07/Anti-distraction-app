// Route: "/focus" → FocusSession (nav hidden on this screen)
import {
  FocusTimer,
  SessionControls,
  SessionStats,
  SubjectStats,
  TimeAdjuster,
  useFocusStore,
} from "@/src/components/focus";
import { RADIUS, SPACING } from "@/src/constants/spacing";
import { focusService } from "@/src/services/focusService";
import { nativeBlockingService } from "@/src/services/nativeBlockingService";
import { storage, STORAGE_KEYS } from "@/src/services/storage";
import { useAuthStore } from "@/src/store/authStore";
import { useHomeStore } from "@/src/store/homeStore";
import { useTheme } from "@/src/theme";
import type { ThemeColors } from "@/src/theme";
import type { Subject } from "@/src/types";
import { router, useLocalSearchParams } from "expo-router";
import {
  BarChart3,
  Clock,
  Flame,
  Plus,
  Quote,
  Sparkles,
  X,
  Zap,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
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

// Motivational quotes for focus sessions
const FOCUS_QUOTES = [
  "The secret of getting ahead is getting started.",
  "Deep work is the ability to focus without distraction.",
  "You don't need more time, you need more focus.",
  "Discipline is choosing between what you want now and what you want most.",
  "Focus on being productive instead of busy.",
  "The successful warrior is the average man with laser-like focus.",
  "Where focus goes, energy flows.",
  "Starve your distractions, feed your focus.",
  "Small daily improvements lead to stunning results.",
  "Flow is the mental state of full immersion and energized focus.",
];

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

// Quick-pick session lengths shown as chips in the starter sheet
const DURATION_PRESETS = [
  { minutes: 15, label: "Quick" },
  { minutes: 25, label: "Pomodoro" },
  { minutes: 45, label: "Deep" },
  { minutes: 60, label: "Marathon" },
];

type FocusLaunchFlow = "focus-starter" | "time-investment" | "custom-target";

const getParamValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const clampDurationMinutes = (value: number) =>
  Number.isFinite(value) ? Math.max(5, Math.min(120, Math.round(value))) : 25;

export default function FocusScreen() {
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
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
    endSession,
    resetSitting,
    stopSession,
    tickSecond,
    loadSubjectData,
  } = useFocusStore();

  const { user } = useAuthStore();
  const { completeDailyChallenge, markFocusSessionCompleted, refreshHomeData } =
    useHomeStore();
  const params = useLocalSearchParams<{
    source?: string;
    flow?: FocusLaunchFlow;
    durationMinutes?: string;
    directiveTitle?: string;
    directiveId?: string;
  }>();
  const launchFlow = getParamValue(params.flow) as FocusLaunchFlow | undefined;
  const directiveTitle = getParamValue(params.directiveTitle);
  const directiveId = getParamValue(params.directiveId);
  const plannedDurationParam = getParamValue(params.durationMinutes);
  const plannedDurationMinutes = plannedDurationParam
    ? clampDurationMinutes(Number(plannedDurationParam))
    : null;
  const isDailyDirectiveLaunch = getParamValue(params.source) === "daily-directive";
  const isTimeLocked = launchFlow === "time-investment" && !!plannedDurationMinutes;
  const skipsSubjectSelection = launchFlow === "custom-target";

  const [showSubjectSelect, setShowSubjectSelect] = useState(
    phase === "idle" && !skipsSubjectSelection,
  );
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [customSubjects, setCustomSubjects] = useState<Subject[]>([]);
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [backendSessionId, setBackendSessionId] = useState<string | null>(null);
  const [distractionCount, setDistractionCount] = useState(0);
  const [pauseCountState, setPauseCountState] = useState(0);
  const [sessionQuote, setSessionQuote] = useState(FOCUS_QUOTES[0]);

  // Add subject form
  const [newSubjectName, setNewSubjectName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(SUBJECT_ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(SUBJECT_COLORS[0]);

  // Load custom subjects and study data on mount
  useEffect(() => {
    // Fresh entry into the focus screen starts a new sitting: clear any
    // leftover session count from a previous visit (unless a session is
    // somehow still in progress).
    const { isActive: stillActive, phase: currentPhase } =
      useFocusStore.getState();
    if (!stillActive && currentPhase !== "done") {
      resetSitting();
    }

    void (async () => {
      const saved = await storage.load<Subject[]>(STORAGE_KEYS.CUSTOM_SUBJECTS);
      if (saved) {
        setCustomSubjects(saved);
      }
      await loadSubjectData();
    })();
  }, [loadSubjectData, resetSitting]);

  useEffect(() => {
    if (phase !== "idle" || sessionStarted) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setSelectedSubject(null);
      setShowSubjectSelect(!skipsSubjectSelection);

      if (isTimeLocked && plannedDurationMinutes) {
        setDurationMinutes(plannedDurationMinutes);
      } else if (launchFlow === "focus-starter" || launchFlow === "custom-target") {
        setDurationMinutes(25);
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [
    isTimeLocked,
    launchFlow,
    phase,
    plannedDurationMinutes,
    sessionStarted,
    skipsSubjectSelection,
  ]);

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

      if (launchFlow === "custom-target" && directiveId) {
        try {
          await completeDailyChallenge(user.userId, directiveId);
        } catch (targetError) {
          console.error("Error completing linked custom target:", targetError);
        }
      }

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
    completeDailyChallenge,
    directiveId,
    pauseCountState,
    refreshHomeData,
    launchFlow,
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

  const beginFocusSession = async (subject: Subject | null) => {
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
        subject
          ? {
              id: subject.id,
              name: subject.name,
              icon: subject.icon,
              color: subject.color,
            }
          : undefined,
        launchFlow === "time-investment"
          ? "planned"
          : launchFlow === "custom-target"
            ? "custom-target"
            : "manual",
      );

      startSession(durationSeconds, totalCycles, subject);
      if (!isDailyDirectiveLaunch) {
        pauseSession();
      }
      const quoteSeed = subject ? subject.id.length + subject.name.length : directiveTitle?.length || 0;
      const quoteIndex = (quoteSeed + durationMinutes) % FOCUS_QUOTES.length;
      setSessionQuote(FOCUS_QUOTES[quoteIndex]);
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
      setShowSubjectSelect(!skipsSubjectSelection);
    }
  };

  const handleStartWithSubject = async (subject: Subject) => {
    await beginFocusSession(subject);
  };

  const handleStartCustomTarget = async () => {
    await beginFocusSession(null);
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

    const trimmedName = newSubjectName.trim();
    const baseId = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "subject";
    let nextIndex = customSubjects.length + 1;
    let subjectId = `custom-${baseId}-${nextIndex}`;

    while (customSubjects.some((subject) => subject.id === subjectId)) {
      nextIndex += 1;
      subjectId = `custom-${baseId}-${nextIndex}`;
    }

    const newSubject: Subject = {
      id: subjectId,
      name: trimmedName,
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
    if (isTimeLocked) {
      return;
    }

    setDurationMinutes((prev) => Math.min(prev + 5, 120));
  };

  const handleDecreaseDuration = () => {
    if (isTimeLocked) {
      return;
    }

    setDurationMinutes((prev) => Math.max(prev - 5, 5));
  };

  const handleSelectPreset = (minutes: number) => {
    if (isTimeLocked) {
      return;
    }

    setDurationMinutes(clampDurationMinutes(minutes));
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

      {/* Cycle indicator dots */}
      {sessionStarted && (
        <View style={styles.cycleWrap}>
          <CycleIndicator completed={cyclesCompleted} total={totalCycles} />
        </View>
      )}

      {/* Motivational quote */}
      {sessionStarted && (
        <View style={styles.quoteBox}>
          <View style={styles.quoteIconWrap}>
            <Quote size={14} color={COLORS.primary} />
          </View>
          <Text style={styles.quoteText}>{sessionQuote}</Text>
        </View>
      )}

      {/* Active session status bar */}
      {sessionStarted && isActive && (
        <View style={styles.statusBar}>
          <View style={styles.statusItem}>
            <Flame size={14} color="#f97316" />
            <Text style={styles.statusValue}>{streak}</Text>
            <Text style={styles.statusLabel}>Streak</Text>
          </View>
          <View style={styles.statusDivider} />
          <View style={styles.statusItem}>
            <Zap size={14} color={COLORS.primary} />
            <Text style={styles.statusValue}>{coinsEarnedThisSession}</Text>
            <Text style={styles.statusLabel}>Coins</Text>
          </View>
          <View style={styles.statusDivider} />
          <View style={styles.statusItem}>
            <BarChart3 size={14} color="#a855f7" />
            <Text style={styles.statusValue}>
              {Math.floor(elapsedSeconds / 60)}m
            </Text>
            <Text style={styles.statusLabel}>Elapsed</Text>
          </View>
        </View>
      )}

      {/* Ready to start message */}
      {sessionStarted &&
        !isActive &&
        phase === "focus" &&
        elapsedSeconds === 0 && (
          <View style={styles.readyMessage}>
            <Text style={styles.readyText}>Press Play to Begin</Text>
            <Text style={styles.readyHint}>
              {selectedSubject ? "Your timer is ready" : "Start when ready"}
            </Text>
          </View>
        )}

      {!sessionStarted && skipsSubjectSelection && (
        <View style={styles.instantStartWrap}>
          <Text style={styles.instantTitle}>{directiveTitle || "Custom Target"}</Text>
          <Text style={styles.instantHint}>{durationMinutes} min focus session</Text>
          <Pressable style={styles.instantStartButton} onPress={handleStartCustomTarget}>
            <Zap size={18} color={COLORS.background} />
            <Text style={styles.instantStartText}>Start</Text>
          </Pressable>
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
      {sessionStarted && (
        <SessionControls
          isActive={isActive}
          onPlayPause={handlePlayPause}
          onStop={handleStop}
          onShield={() => {}}
          debugLabel="Simulate App Interruption"
          onDebug={() => {}}
        />
      )}

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
            {/* Grab handle */}
            <View style={styles.grabHandle} />

            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalHeaderIcon}>
                  <Sparkles size={18} color={COLORS.primary} />
                </View>
                <View style={styles.modalHeaderText}>
                  <Text style={styles.modalTitle}>
                    {launchFlow === "time-investment"
                      ? "Time Investment"
                      : "Start Focus Session"}
                  </Text>
                  <Text style={styles.modalHeaderSubtitle}>
                    Set your length, then pick a subject
                  </Text>
                </View>
              </View>
              <Pressable
                style={styles.modalCloseBtn}
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
                locked={isTimeLocked}
                presets={DURATION_PRESETS}
                onSelectPreset={handleSelectPreset}
              />
            </View>

            <View style={styles.subjectSectionHeader}>
              <Clock size={14} color={COLORS.textSecondary} />
              <Text style={styles.modalSubtitle}>
                {isTimeLocked
                  ? "Choose a subject for this planned time"
                  : "Choose a subject to focus on"}
              </Text>
            </View>

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
                    pressed && {
                      borderColor: subject.color,
                      backgroundColor: `${subject.color}12`,
                      transform: [{ scale: 0.98 }],
                    },
                  ]}
                  onPress={() => handleStartWithSubject(subject)}
                >
                  {subject.isCustom && (
                    <View style={styles.customBadgePill}>
                      <Text style={styles.customBadge}>Custom</Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.subjectIconBox,
                      { backgroundColor: `${subject.color}20` },
                    ]}
                  >
                    <Text style={styles.subjectCardIcon}>{subject.icon}</Text>
                  </View>
                  <Text style={styles.subjectCardName}>{subject.name}</Text>
                  <View
                    style={[
                      styles.startIndicator,
                      { backgroundColor: subject.color },
                    ]}
                  >
                    <Zap size={11} color="#fff" fill="#fff" />
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

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
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
  instantStartWrap: {
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    marginBottom: 8,
    paddingHorizontal: 24,
  },
  instantTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
  },
  instantHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  instantStartButton: {
    minHeight: 48,
    minWidth: 132,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 18,
    marginTop: 4,
  },
  instantStartText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.background,
  },

  // Cycle indicator
  cycleWrap: {
    marginTop: 12,
    marginBottom: 4,
  },

  // Motivational quote
  quoteBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginHorizontal: 32,
    marginTop: 14,
    padding: 12,
    backgroundColor: `${COLORS.primary}08`,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: `${COLORS.primary}15`,
  },
  quoteIconWrap: {
    marginTop: 2,
    flexShrink: 0,
  },
  quoteText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: "italic",
    lineHeight: 18,
    flex: 1,
  },

  // Active session status bar
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
    marginTop: 16,
    marginHorizontal: 32,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  statusLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statusDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
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
  grabHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    flex: 1,
  },
  modalHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: `${COLORS.primary}18`,
    alignItems: "center",
    justifyContent: "center",
  },
  modalHeaderText: {
    flex: 1,
    gap: 2,
  },
  modalHeaderSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },
  subjectSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
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
    position: "relative",
    overflow: "hidden",
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
  customBadgePill: {
    position: "absolute",
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: `${COLORS.primary}1a`,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  customBadge: {
    fontSize: 8,
    color: COLORS.primary,
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  startIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: RADIUS.full,
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
