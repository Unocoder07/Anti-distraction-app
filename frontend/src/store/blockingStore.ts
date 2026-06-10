// Blocking Store using Zustand
import { create } from 'zustand';
import { BlockedApp, BlockingSession, blockingService } from '../services/blockingService';

interface BlockingState {
  apps: BlockedApp[];
  activeSessions: Map<number, BlockingSession>; // appId -> session
  loading: boolean;
  error: string | null;

  // Actions
  loadBlockedApps: (userId: string) => Promise<void>;
  saveUserBlockedApps: (userId: string, apps: BlockedApp[]) => Promise<void>;
  toggleApp: (userId: string, appId: number) => Promise<void>;
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

      set({ apps, activeSessions: sessionMap, loading: false });
    } catch (error: any) {
      console.error('Error loading blocked apps:', error);
      set({ error: error.message, loading: false });
    }
  },

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

  startSession: async (userId: string, appId: number, appName: string, duration?: number) => {
    try {
      set({ loading: true, error: null });
      const session = await blockingService.startBlockingSession(userId, appId, appName, duration);
      
      const { activeSessions } = get();
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
      const coinsEarned = await blockingService.completeBlockingSession(sessionId, userId);
      
      const { activeSessions } = get();
      const newSessions = new Map(activeSessions);
      newSessions.delete(appId);
      
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
      const coinsLost = await blockingService.breakBlockingSession(sessionId, userId);
      
      const { activeSessions } = get();
      const newSessions = new Map(activeSessions);
      newSessions.delete(appId);
      
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
      
      // Clear active sessions from state
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
