// Blocking Store using Zustand
import { create } from 'zustand';
import { BlockedApp, BlockingSession, DEFAULT_SESSION_DURATION, blockingService } from '../services/blockingService';
import { nativeBlockingService } from '../services/nativeBlockingService';
import { storage, STORAGE_KEYS } from '../services/storage';

function getNativeBlockedApps(apps: BlockedApp[]) {
  return apps
    .filter((app) => app.blocked && app.packageName)
    .map((app) => ({
      packageName: app.packageName!,
      appName: app.name,
    }));
}

const LOCAL_SESSION_PREFIX = 'local-native-';

function createLocalSession(
  userId: string,
  appId: number,
  appName: string,
  duration: number
): BlockingSession {
  return {
    id: `${LOCAL_SESSION_PREFIX}${Date.now()}`,
    userId,
    appId,
    appName,
    startTime: new Date(),
    duration,
    status: 'active',
    coinsEarned: 0,
    coinsLost: 0,
  };
}

function isLocalSession(sessionId: string) {
  return sessionId.startsWith(LOCAL_SESSION_PREFIX);
}

interface BlockingState {
  apps: BlockedApp[];
  activeSessions: Map<number, BlockingSession>; // appId -> session
  loading: boolean;
  error: string | null;

  // Actions
  loadBlockedApps: (userId: string) => Promise<void>;
  loadLocalBlockedApps: () => Promise<void>;
  saveUserBlockedApps: (userId: string, apps: BlockedApp[]) => Promise<void>;
  saveLocalBlockedApps: (apps: BlockedApp[]) => Promise<void>;
  setApps: (apps: BlockedApp[]) => void;
  toggleApp: (userId: string, appId: number) => Promise<void>;
  toggleLocalApp: (appId: number) => Promise<void>;
  startSession: (userId: string, appId: number, appName: string, duration?: number) => Promise<void>;
  completeSession: (sessionId: string, userId: string, appId: number) => Promise<number>;
  breakSession: (sessionId: string, userId: string, appId: number) => Promise<number>;
  checkActiveSession: (userId: string, appId: number) => Promise<BlockingSession | null>;
  cleanupStaleSessions: (userId: string) => Promise<number>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useBlockingStore = create<BlockingState>((set, get) => ({
  apps: [],
  activeSessions: new Map(),
  loading: false,
  error: null,

  loadBlockedApps: async (userId: string) => {
    try {
      set({ loading: true, error: null });
      const apps = await blockingService.getUserBlockedApps(userId);
      
      // Load active sessions
      const sessions = await blockingService.getActiveBlockingSessions(userId);
      const sessionMap = new Map<number, BlockingSession>();
      sessions.forEach(session => {
        sessionMap.set(session.appId, session);
      });

      let nativeReady = sessions.length === 0;
      if (sessions.length > 0) {
        const blockedAppsForNative = getNativeBlockedApps(apps);
        if (blockedAppsForNative.length > 0) {
          nativeReady = await nativeBlockingService.startNativeSession(sessions[0], blockedAppsForNative);
        }
      }

      set({
        apps,
        activeSessions: nativeReady ? sessionMap : new Map(),
        error: nativeReady ? null : 'Shield session found, but native blocking could not be started.',
        loading: false,
      });
    } catch (error: any) {
      console.error('Error loading blocked apps:', error);
      set({ error: error.message, loading: false });
    }
  },

  loadLocalBlockedApps: async () => {
    try {
      const saved = await storage.load<BlockedApp[]>(STORAGE_KEYS.BLOCKED_APPS);
      set({ apps: saved ?? [], loading: false });
    } catch (error: any) {
      console.error('Error loading local blocked apps:', error);
      set({ apps: [], loading: false });
    }
  },

  saveLocalBlockedApps: async (apps: BlockedApp[]) => {
    await storage.save(STORAGE_KEYS.BLOCKED_APPS, apps);
    set({ apps });
  },

  setApps: (apps) => set({ apps }),

  saveUserBlockedApps: async (userId: string, apps: BlockedApp[]) => {
    try {
      set({ loading: true, error: null });
      await blockingService.saveUserBlockedApps(userId, apps);
      set({ apps, loading: false });
    } catch (error: any) {
      console.error('Error saving blocked apps:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  toggleApp: async (userId: string, appId: number) => {
    try {
      set({ loading: true, error: null });
      const { apps } = get();
      const updatedApps = await blockingService.toggleAppBlocking(userId, appId, apps);
      set({ apps: updatedApps, loading: false });
    } catch (error: any) {
      console.error('Error toggling app:', error);
      set({ error: error.message, loading: false });
    }
  },

  toggleLocalApp: async (appId: number) => {
    const { apps } = get();
    const updated = apps.map((a) => (a.id === appId ? { ...a, blocked: !a.blocked } : a));
    await storage.save(STORAGE_KEYS.BLOCKED_APPS, updated);
    set({ apps: updated });
  },

  startSession: async (userId: string, appId: number, appName: string, duration?: number) => {
    try {
      set({ loading: true, error: null });
      const sessionDuration = duration ?? DEFAULT_SESSION_DURATION;
      const localSession = createLocalSession(userId, appId, appName, sessionDuration);
      
      const { activeSessions, apps } = get();

      // Start NATIVE blocking — only apps the student marked as blocked
      const blockedAppsForNative = getNativeBlockedApps(apps);
      if (blockedAppsForNative.length === 0) {
        throw new Error('No apps selected for blocking. Toggle apps to BLOCKED first.');
      }

      const nativeStarted = await nativeBlockingService.startNativeSession(localSession, blockedAppsForNative);
      if (!nativeStarted) {
        throw new Error('Native blocking failed. Grant Shield permissions and try again.');
      }

      let session = localSession;
      try {
        const serverSession = await blockingService.startBlockingSession(userId, appId, appName, sessionDuration);
        const realSessionStarted = await nativeBlockingService.startNativeSession(serverSession, blockedAppsForNative);
        if (realSessionStarted) {
          session = serverSession;
        }
      } catch (error) {
        console.warn('Backend unavailable; continuing with local native blocking session:', error);
      }

      const newSessions = new Map(activeSessions);
      newSessions.set(appId, session);
      
      set({ activeSessions: newSessions, loading: false });
    } catch (error: any) {
      console.error('Error starting session:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  completeSession: async (sessionId: string, userId: string, appId: number) => {
    try {
      set({ loading: true, error: null });
      const coinsEarned = isLocalSession(sessionId)
        ? 0
        : await blockingService.completeBlockingSession(sessionId, userId);
      
      const { activeSessions } = get();
      const newSessions = new Map(activeSessions);
      newSessions.delete(appId);

      // Stop NATIVE blocking
      await nativeBlockingService.stopNativeSession();
      
      set({ activeSessions: newSessions, loading: false });
      return coinsEarned;
    } catch (error: any) {
      console.error('Error completing session:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  breakSession: async (sessionId: string, userId: string, appId: number) => {
    try {
      set({ loading: true, error: null });
      const coinsLost = isLocalSession(sessionId)
        ? 0
        : await blockingService.breakBlockingSession(sessionId, userId);
      
      const { activeSessions } = get();
      const newSessions = new Map(activeSessions);
      newSessions.delete(appId);

      // Stop NATIVE blocking
      await nativeBlockingService.stopNativeSession();
      
      set({ activeSessions: newSessions, loading: false });
      return coinsLost;
    } catch (error: any) {
      console.error('Error breaking session:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  checkActiveSession: async (userId: string, appId: number) => {
    try {
      const session = await blockingService.hasActiveSession(userId, appId);
      
      if (session) {
        const { activeSessions } = get();
        const newSessions = new Map(activeSessions);
        newSessions.set(appId, session);
        set({ activeSessions: newSessions });
      }
      
      return session;
    } catch (error: any) {
      console.error('Error checking active session:', error);
      return null;
    }
  },

  cleanupStaleSessions: async (userId: string) => {
    try {
      set({ loading: true, error: null });
      const cleanedCount = await blockingService.cleanupStaleSessions(userId);
      
      nativeBlockingService.stopNativeSession();
      set({ activeSessions: new Map(), loading: false });

      return cleanedCount;
    } catch (error: any) {
      console.error('Error cleaning up stale sessions:', error);
      set({ error: error.message, loading: false });
      return 0;
    }
  },

  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
}));
