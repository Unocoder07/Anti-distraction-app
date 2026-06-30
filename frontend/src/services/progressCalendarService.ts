import { toLocalDateKey } from '@/src/utils/time';
import { focusService, type FocusSession } from './focusService';
import { storage, STORAGE_KEYS } from './storage';

export type ProgressMarkSource = 'session' | 'task';

export interface ProgressCalendarMark {
  date: string;
  sessions: number;
  tasks: number;
  minutes: number;
}

type StoredProgressCalendar = Record<string, ProgressCalendarMark>;
type CompletedTaskInput = {
  completed?: boolean;
  date?: string;
  completedAt?: Date | string;
};

const emptyMark = (date: string): ProgressCalendarMark => ({
  date,
  sessions: 0,
  tasks: 0,
  minutes: 0,
});

const normalizeMark = (date: string, mark?: Partial<ProgressCalendarMark>): ProgressCalendarMark => ({
  ...emptyMark(date),
  ...mark,
  date,
  sessions: Math.max(0, Math.round(mark?.sessions ?? 0)),
  tasks: Math.max(0, Math.round(mark?.tasks ?? 0)),
  minutes: Math.max(0, Math.round(mark?.minutes ?? 0)),
});

const getTaskDateKey = (task: CompletedTaskInput): string => {
  const sourceDate = task.completedAt ?? task.date;
  if (!sourceDate) {
    return toLocalDateKey(new Date());
  }

  const parsed = sourceDate instanceof Date ? sourceDate : new Date(sourceDate);
  if (Number.isNaN(parsed.getTime())) {
    return String(sourceDate).slice(0, 10);
  }

  return toLocalDateKey(parsed);
};

class ProgressCalendarService {
  async recordMark(
    userId: string,
    source: ProgressMarkSource,
    date = new Date(),
    minutes = 0,
  ): Promise<ProgressCalendarMark[]> {
    const dateKey = toLocalDateKey(date);
    const stored = await this.loadStoredMarks(userId);
    const current = normalizeMark(dateKey, stored[dateKey]);

    stored[dateKey] = {
      ...current,
      sessions: current.sessions + (source === 'session' ? 1 : 0),
      tasks: current.tasks + (source === 'task' ? 1 : 0),
      minutes: current.minutes + Math.max(0, Math.round(minutes)),
    };

    await this.saveStoredMarks(userId, stored);
    return Object.values(stored).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Idempotently mark a day as having a completed focus session.
   * Re-running for the same day keeps the session flag at 1, so multiple
   * sessions in one day never create duplicate marks.
   */
  async recordSessionDay(
    userId: string,
    date = new Date(),
    minutes = 0,
  ): Promise<ProgressCalendarMark[]> {
    const dateKey = toLocalDateKey(date);
    const stored = await this.loadStoredMarks(userId);
    const current = normalizeMark(dateKey, stored[dateKey]);

    stored[dateKey] = {
      ...current,
      sessions: Math.max(current.sessions, 1),
      minutes: Math.max(current.minutes, Math.round(minutes)),
    };

    await this.saveStoredMarks(userId, stored);
    return Object.values(stored).sort((a, b) => a.date.localeCompare(b.date));
  }

  async syncCompletedSessions(userId: string, limit = 365): Promise<ProgressCalendarMark[]> {
    const sessions = await focusService.getUserSessions(userId, limit);
    return this.mergeCompletedSessions(userId, sessions);
  }

  async syncDailyTasks(
    userId: string,
    tasks: CompletedTaskInput[],
  ): Promise<ProgressCalendarMark[]> {
    const stored = await this.loadStoredMarks(userId);

    tasks
      .filter((task) => task.completed)
      .forEach((task) => {
        const dateKey = getTaskDateKey(task);
        const current = normalizeMark(dateKey, stored[dateKey]);
        stored[dateKey] = {
          ...current,
          tasks: Math.max(current.tasks, 1),
        };
      });

    await this.saveStoredMarks(userId, stored);
    return Object.values(stored).sort((a, b) => a.date.localeCompare(b.date));
  }

  private async mergeCompletedSessions(
    userId: string,
    sessions: FocusSession[],
  ): Promise<ProgressCalendarMark[]> {
    const stored = await this.loadStoredMarks(userId);

    sessions
      .filter((session) => session.status === 'completed')
      .forEach((session) => {
        const date = session.completedAt ?? session.endTime ?? session.startTime;
        const dateKey = toLocalDateKey(date);
        const current = normalizeMark(dateKey, stored[dateKey]);

        stored[dateKey] = {
          ...current,
          sessions: Math.max(current.sessions, 1),
          minutes: Math.max(current.minutes, Math.round(session.actualDuration ?? 0)),
        };
      });

    await this.saveStoredMarks(userId, stored);
    return Object.values(stored).sort((a, b) => a.date.localeCompare(b.date));
  }

  private getStorageKey(userId: string): string {
    return `${STORAGE_KEYS.PROGRESS_CALENDAR}:${userId}`;
  }

  private async loadStoredMarks(userId: string): Promise<StoredProgressCalendar> {
    const raw = await storage.load<StoredProgressCalendar>(this.getStorageKey(userId));
    if (!raw) {
      return {};
    }

    return Object.entries(raw).reduce<StoredProgressCalendar>((acc, [date, mark]) => {
      acc[date] = normalizeMark(date, mark);
      return acc;
    }, {});
  }

  private async saveStoredMarks(
    userId: string,
    marks: StoredProgressCalendar,
  ): Promise<void> {
    await storage.save(this.getStorageKey(userId), marks);
  }
}

export const progressCalendarService = new ProgressCalendarService();
