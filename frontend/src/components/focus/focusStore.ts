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
  cyclesCompleted: number;
  totalCycles: number;
  elapsedSeconds: number;
  coinsEarnedThisSession: number;
  currentSubject: Subject | null;
  sessionStartTime: number | null;

  // ── Subject study data ──
  subjectStudyData: Record<string, SubjectStudyData>;

  // ── Actions ──
  startSession: (durationSeconds?: number, cycles?: number, subject?: Subject | null) => void;
  pauseSession: () => void;
  resumeSession: () => void;
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
  totalCycles: 4,
  elapsedSeconds: 0,
  coinsEarnedThisSession: 0,
  currentSubject: null,
  sessionStartTime: null,

  // ── Subject study data ──
  subjectStudyData: {},

  // ── Actions ──
  startSession: (durationSeconds = FOCUS_DURATION, cycles = 4, subject = null) =>
    set({
      phase: 'focus',
      timeLeft: durationSeconds,
      totalSeconds: durationSeconds,
      isActive: true,
      cyclesCompleted: 0,
      totalCycles: cycles,
      elapsedSeconds: 0,
      coinsEarnedThisSession: 0,
      currentSubject: subject,
      sessionStartTime: Date.now(),
    }),

  pauseSession: () => set({ isActive: false }),

  resumeSession: () => set({ isActive: true }),

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
    const { timeLeft, cyclesCompleted, totalCycles, totalSeconds, elapsedSeconds } = get();

    if (timeLeft <= 1) {
      // Cycle complete
      const newCycles = cyclesCompleted + 1;
      const earned = COINS_PER_CYCLE;

      if (newCycles >= totalCycles) {
        // All cycles done
        set((s) => ({
          phase: 'done',
          isActive: false,
          timeLeft: 0,
          cyclesCompleted: newCycles,
          coins: s.coins + earned,
          coinsEarnedThisSession: s.coinsEarnedThisSession + earned,
          totalSessionsCompleted: s.totalSessionsCompleted + 1,
          elapsedSeconds: s.elapsedSeconds + 1,
        }));
      } else {
        // Next cycle
        set((s) => ({
          timeLeft: totalSeconds,
          cyclesCompleted: newCycles,
          coins: s.coins + earned,
          coinsEarnedThisSession: s.coinsEarnedThisSession + earned,
          elapsedSeconds: s.elapsedSeconds + 1,
        }));
      }
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
