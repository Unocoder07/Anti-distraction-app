// Shared progress-tracker logic used by the Home streak calendar and the
// Analytics history view. Keeping it here avoids duplicating grid / streak /
// completion math across screens.
import { toLocalDateKey } from './time';

export interface ProgressMark {
  date: string; // YYYY-MM-DD
  sessions: number;
  tasks: number;
  minutes: number;
}

export interface CalendarCell {
  key: string;
  dayOfMonth: number | null;
  dateKey: string | null;
}

export interface MonthSummary {
  /** Days in the month that have at least one session or task. */
  activeDays: number;
  /** Total focus sessions completed in the month. */
  totalSessions: number;
  /** Completion rate (0-100) over the days that have already elapsed. */
  completionRate: number;
  /** Number of days already elapsed in the month (capped at today for the current month). */
  elapsedDays: number;
  /** Days in the full month. */
  daysInMonth: number;
}

/** A day counts as "completed" when the user logged at least one session or task. */
export const isDayCompleted = (mark?: ProgressMark): boolean =>
  !!mark && (mark.sessions > 0 || mark.tasks > 0);

/**
 * Intensity bucket (0-4) used to drive the heat-map fill, LeetCode style.
 *   0 = nothing, 1 = one session, 2 = two, 3 = three, 4 = four or more.
 * Daily tasks alone (no session) register as the lowest active level.
 */
export const getIntensityLevel = (mark?: ProgressMark): 0 | 1 | 2 | 3 | 4 => {
  if (!mark) return 0;
  const sessions = mark.sessions;
  if (sessions <= 0) return mark.tasks > 0 ? 1 : 0;
  if (sessions === 1) return 1;
  if (sessions === 2) return 2;
  if (sessions === 3) return 3;
  return 4;
};

/** Build a Sunday-first month grid with leading/trailing blank cells. */
export const buildMonthGrid = (month: Date): CalendarCell[] => {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: CalendarCell[] = [];

  for (let i = 0; i < firstDay.getDay(); i += 1) {
    cells.push({ key: `empty-start-${i}`, dayOfMonth: null, dateKey: null });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = toLocalDateKey(new Date(year, monthIndex, day));
    cells.push({ key: dateKey, dayOfMonth: day, dateKey });
  }

  let trailing = 0;
  while (cells.length % 7 !== 0) {
    cells.push({ key: `empty-end-${trailing}`, dayOfMonth: null, dateKey: null });
    trailing += 1;
  }

  return cells;
};

/** Index marks by their date key for O(1) lookups. */
export const indexMarks = (marks: ProgressMark[]): Record<string, ProgressMark> =>
  marks.reduce<Record<string, ProgressMark>>((acc, mark) => {
    acc[mark.date] = mark;
    return acc;
  }, {});

/**
 * Current and best consecutive-day streaks across the full mark history.
 * The current streak counts back from today (a missing-but-not-yet-completed
 * today does not break it — yesterday still anchors the streak).
 */
export const computeStreaks = (
  marks: ProgressMark[],
  today = new Date(),
): { currentStreak: number; bestStreak: number } => {
  const completed = new Set(marks.filter(isDayCompleted).map((m) => m.date));

  // Best streak: walk sorted completed days, count consecutive runs.
  const sorted = [...completed].sort();
  let bestStreak = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const key of sorted) {
    const [y, m, d] = key.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    if (prev && Math.round((date.getTime() - prev.getTime()) / 86400000) === 1) {
      run += 1;
    } else {
      run = 1;
    }
    bestStreak = Math.max(bestStreak, run);
    prev = date;
  }

  // Current streak: count back from today, allowing today to be still pending.
  let currentStreak = 0;
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!completed.has(toLocalDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1); // today not done yet — anchor on yesterday
  }
  while (completed.has(toLocalDateKey(cursor))) {
    currentStreak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { currentStreak, bestStreak };
};

/** Aggregate stats for a single month, used by both Home and Analytics. */
export const summarizeMonth = (
  marks: ProgressMark[],
  month: Date,
  today = new Date(),
): MonthSummary => {
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const isCurrentMonth =
    month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth();
  const isFutureMonth =
    month.getFullYear() > today.getFullYear() ||
    (month.getFullYear() === today.getFullYear() && month.getMonth() > today.getMonth());

  const elapsedDays = isFutureMonth ? 0 : isCurrentMonth ? today.getDate() : daysInMonth;

  const activeMarks = marks.filter(isDayCompleted);
  const activeDays = activeMarks.length;
  const totalSessions = marks.reduce((sum, m) => sum + Math.max(0, m.sessions), 0);
  const completionRate =
    elapsedDays > 0 ? Math.round((activeDays / elapsedDays) * 100) : 0;

  return { activeDays, totalSessions, completionRate, elapsedDays, daysInMonth };
};
