// ─── User Types ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  role?: string;
  joinedAt: string;
}

export interface UserStats {
  coins: number;
  level: number;
  xp: number;
  totalXP: number;
  streak: number;
  bestStreak: number;
  totalSessions: number;
  totalFocusTime: number; // in seconds
  globalRank?: number;
}

// ─── Session Types ──────────────────────────────────────────────────────────

export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  isCustom?: boolean;
}

export interface FocusSession {
  id: string;
  startTime: number; // timestamp
  endTime?: number; // timestamp
  duration: number; // seconds
  cyclesCompleted: number;
  totalCycles: number;
  coinsEarned: number;
  status: 'active' | 'completed' | 'failed';
  interruptions: number;
  subjectId?: string;
  subjectName?: string;
}

export interface SessionHistory {
  date: string; // YYYY-MM-DD
  sessions: FocusSession[];
  totalFocusTime: number;
  coinsEarned: number;
}

export interface SubjectStudyData {
  subjectId: string;
  subjectName: string;
  totalSessions: number;
  totalFocusTime: number; // seconds
  lastStudied?: number; // timestamp
  sessionsHistory: FocusSession[];
}

// ─── Pet Types ──────────────────────────────────────────────────────────────

export type PetMood = 'optimal' | 'happy' | 'tired' | 'sad';

export interface PetState {
  mood: PetMood;
  loyalty: number; // 0-100
  health: number; // 0-100
  level: number;
  lastFed?: number; // timestamp
  evolution?: string;
}

// ─── Achievement Types ──────────────────────────────────────────────────────

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  unlocked: boolean;
  progress?: number; // 0-100
  unlockedAt?: string;
  requirement: {
    type: 'sessions' | 'streak' | 'coins' | 'time' | 'level';
    value: number;
  };
}

// ─── App Blocking Types ─────────────────────────────────────────────────────

export interface BlockedApp {
  id: number;
  name: string;
  category: string;
  icon: string;
  blocked: boolean;
  packageName?: string; // Android
  bundleId?: string; // iOS
}

export interface BlockingRule {
  id: string;
  appId: number;
  enabled: boolean;
  schedule?: {
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    days: number[]; // 0-6 (Sunday-Saturday)
  };
}

// ─── Analytics Types ────────────────────────────────────────────────────────

export interface DailyStats {
  date: string; // YYYY-MM-DD
  focusTime: number; // seconds
  sessions: number;
  coinsEarned: number;
  focusScore: number; // 0-100
}

export interface WeeklyStats {
  weekStart: string; // YYYY-MM-DD
  weekEnd: string; // YYYY-MM-DD
  totalFocusTime: number;
  totalSessions: number;
  averageFocusScore: number;
  dailyStats: DailyStats[];
}

export interface TrendDataPoint {
  label: string;
  value: number;
}

export interface WeeklyDataPoint {
  day: string;
  hours: number;
}

// ─── Goal Types ─────────────────────────────────────────────────────────────

export interface DailyGoal {
  id: string;
  title: string;
  description: string;
  reward: string;
  progress: number;
  total: number;
  unit: string;
  completed?: boolean;
  type: 'focus_time' | 'sessions' | 'streak' | 'custom';
}

// ─── Settings Types ─────────────────────────────────────────────────────────

export interface AppSettings {
  // Focus settings
  defaultSessionDuration: number; // minutes
  defaultCycles: number;
  breakDuration: number; // minutes
  longBreakDuration: number; // minutes
  
  // Notifications
  notificationsEnabled: boolean;
  sessionStartReminder: boolean;
  breakReminder: boolean;
  
  // Blocking
  detoxModeEnabled: boolean;
  grayscaleMode: boolean;
  notificationSuppression: boolean;
  
  // Audio
  soundEnabled: boolean;
  tickingSound: boolean;
  completionSound: boolean;
  
  // Haptics
  hapticsEnabled: boolean;
  
  // Theme
  theme: 'dark' | 'light' | 'auto';
  accentColor?: string;
}

// ─── API Response Types ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ─── Navigation Types ───────────────────────────────────────────────────────

export type RootStackParamList = {
  '(tabs)': undefined;
  focus: undefined;
};

export type TabParamList = {
  index: undefined;
  analytics: undefined;
  'blocked-apps': undefined;
  profile: undefined;
};
