// Authentication Store using Zustand + Spring Boot backend
import { create } from 'zustand';
import { authService, AuthUser, UserProfile } from '../services/authService';

interface AuthState {
  user: AuthUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;

  setUser: (user: AuthUser | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  setSession: (authResponse: {
    token: string;
    userId: string;
    username: string;
    email: string;
    avatar?: string;
    exam?: string;
    examName?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userProfile: null,
  loading: true,
  initialized: false,
  error: null,

  setUser: (user) => set({ user }),

  setUserProfile: (profile) => set({ userProfile: profile }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  setInitialized: (initialized) => set({ initialized }),

  setSession: async (authResponse) => {
    const user: AuthUser = {
      userId: authResponse.userId,
      username: authResponse.username,
      email: authResponse.email,
      avatar: authResponse.avatar,
      token: authResponse.token,
    };
    await authService.persistSession(user);
    set({ user });

    // Don't wait for profile to finish if we already have the basic info needed for navigation
    authService.getUserProfile(user.userId).then(profile => {
      set({ userProfile: profile });
    }).catch(err => console.error('Error fetching profile after login:', err));
  },

  signOut: async () => {
    try {
      set({ loading: true, error: null });
      await authService.signOut();
      set({ user: null, userProfile: null, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  refreshUserProfile: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const profile = await authService.getUserProfile(user.userId);
      set({ userProfile: profile });
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  },

  initializeAuth: async () => {
    set({ loading: true, error: null });

    try {
      const user = await authService.restoreSession();
      if (!user) {
        set({ user: null, userProfile: null, loading: false, initialized: true });
        return;
      }

      set({ user, loading: false, initialized: true });

      authService.getUserProfile(user.userId).then(profile => {
        set({ userProfile: profile });
      }).catch(error => {
        console.error('Error fetching profile after session restore:', error);
      });
    } catch (error) {
      console.error('Error restoring session:', error);
      await authService.clearSession();
      set({ user: null, userProfile: null, loading: false, initialized: true });
    }
  },
}));
