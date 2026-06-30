import { storage, STORAGE_KEYS } from '@/src/services/storage';
import type { Subject, SubjectStudyData } from '@/src/types';
import { create } from 'zustand';

export type SessionPhase = 'idle' | 'focus' | 'break' | 'done';

interface FocusState {
  // ── Persistent stats ──
  coins: number;
  streak: number;
  totalSessionsCompleted: number;

  // ── Active session ──
  phase: SessionPhase;
  timeLeft: number;
  totalSeconds: number;
  isActive: boolean;
  /** How many sessions the user has completed in this sitting (Session 1, 2, 3…). */
  cyclesCompleted: number;
  totalCycles: number;
  elapsedSeconds: number;
  coinsEarnedThisSession: number;
  currentSubject: Subject | null;
  sessionStartTime: number | null;

  // ── Subject study data ──
  subjectStudyData: Record<string, SubjectStudyData>;

  // ── Actions ──
  startSession: (durationSeconds?: number, subject?: Subject | null) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  /** End the finished session and return to the idle "start" state, keeping the sitting's session count. */
  endSession: () => void;
  /** Clear the whole sitting (count included) — used on a fresh entry to the focus screen. */
  resetSitting: () => void;
  stopSession: () => void;
  tickSecond: () => void;
  addCoins: (amount: number) => void;
  loadSubjectData: () => Promise<void>;
  saveSubjectData: () => Promise<void>;
}

const FOCUS_DURATION = 25 * 60; // 25 min
const COINS_PER_CYCLE = 25;

export const useFocusStore = create<FocusState>((set, get) => ({
  // ── Persistent stats ──
  coins: 1240,
  streak: 12,
  totalSessionsCompleted: 24,

  // ── Active session ──
  phase: 'idle',
  timeLeft: FOCUS_DURATION,
  totalSeconds: FOCUS_DURATION,
  isActive: false,
  cyclesCompleted: 0,
  totalCycles: 1,
  elapsedSeconds: 0,
  coinsEarnedThisSession: 0,
  currentSubject: null,
  sessionStartTime: null,

  // ── Subject study data ──
  subjectStudyData: {},

  // ── Actions ──
  // Start a single-countdown session. The sitting's session count
  // (cyclesCompleted) is intentionally preserved so each manual start
  // becomes the next session (Session 1 → 2 → 3).
  startSession: (durationSeconds = FOCUS_DURATION, subject = null) =>
    set({
      phase: 'focus',
      timeLeft: durationSeconds,
      totalSeconds: durationSeconds,
      isActive: true,
      elapsedSeconds: 0,
      coinsEarnedThisSession: 0,
      currentSubject: subject,
      sessionStartTime: Date.now(),
    }),

  pauseSession: () => set({ isActive: false }),

  resumeSession: () => set({ isActive: true }),

  // Session finished — stop and drop back to the idle "start" screen so the
  // user can manually begin another. The completed-session count is kept.
  endSession: () =>
    set((s) => ({
      phase: 'idle',
      isActive: false,
      timeLeft: s.totalSeconds,
      elapsedSeconds: 0,
      coinsEarnedThisSession: 0,
      sessionStartTime: null,
    })),

  // Fresh entry into the focus screen: wipe the sitting entirely.
  resetSitting: () =>
    set({
      phase: 'idle',
      isActive: false,
      timeLeft: FOCUS_DURATION,
      totalSeconds: FOCUS_DURATION,
      cyclesCompleted: 0,
      elapsedSeconds: 0,
      coinsEarnedThisSession: 0,
      currentSubject: null,
      sessionStartTime: null,
    }),

  stopSession: () =>
    set((state) => {
      // Save session data if there was a subject
      if (state.currentSubject && state.elapsedSeconds > 0) {
        const subjectId = state.currentSubject.id;
        const existingData = state.subjectStudyData[subjectId] || {
          subjectId,
          subjectName: state.currentSubject.name,
          totalSessions: 0,
          totalFocusTime: 0,
          sessionsHistory: [],
        };

        const session = {
          id: `${Date.now()}-${Math.random()}`,
          startTime: state.sessionStartTime || Date.now(),
          endTime: Date.now(),
          duration: state.elapsedSeconds,
          cyclesCompleted: state.cyclesCompleted,
          totalCycles: state.totalCycles,
          coinsEarned: state.coinsEarnedThisSession,
          status: 'completed' as const,
          interruptions: 0,
          subjectId: state.currentSubject.id,
          subjectName: state.currentSubject.name,
        };

        const updatedData = {
          ...existingData,
          totalSessions: existingData.totalSessions + 1,
          totalFocusTime: existingData.totalFocusTime + state.elapsedSeconds,
          lastStudied: Date.now(),
          sessionsHistory: [...existingData.sessionsHistory, session],
        };

        const newSubjectData = {
          ...state.subjectStudyData,
          [subjectId]: updatedData,
        };

        // Save to storage
        storage.save(STORAGE_KEYS.SUBJECT_STUDY_DATA, newSubjectData);

        return {
          phase: 'idle',
          isActive: false,
          timeLeft: state.totalSeconds,
          elapsedSeconds: 0,
          coinsEarnedThisSession: 0,
          currentSubject: null,
          sessionStartTime: null,
          subjectStudyData: newSubjectData,
        };
      }

      return {
        phase: 'idle',
        isActive: false,
        timeLeft: state.totalSeconds,
        elapsedSeconds: 0,
        coinsEarnedThisSession: 0,
        currentSubject: null,
        sessionStartTime: null,
      };
    }),

  tickSecond: () => {
    const { timeLeft, elapsedSeconds } = get();

    if (timeLeft <= 1) {
      // Countdown finished — stop completely. No automatic next cycle.
      const earned = COINS_PER_CYCLE;
      set((s) => ({
        phase: 'done',
        isActive: false,
        timeLeft: 0,
        cyclesCompleted: s.cyclesCompleted + 1,
        coins: s.coins + earned,
        coinsEarnedThisSession: s.coinsEarnedThisSession + earned,
        totalSessionsCompleted: s.totalSessionsCompleted + 1,
        elapsedSeconds: s.elapsedSeconds + 1,
      }));
    } else {
      set({ timeLeft: timeLeft - 1, elapsedSeconds: elapsedSeconds + 1 });
    }
  },

  addCoins: (amount) =>
    set((state) => ({ coins: state.coins + amount })),

  loadSubjectData: async () => {
    const data = await storage.load<Record<string, SubjectStudyData>>(
      STORAGE_KEYS.SUBJECT_STUDY_DATA
    );
    if (data) {
      set({ subjectStudyData: data });
    }
  },

  saveSubjectData: async () => {
    const { subjectStudyData } = get();
    await storage.save(STORAGE_KEYS.SUBJECT_STUDY_DATA, subjectStudyData);
  },
}));
