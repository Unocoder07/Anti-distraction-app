// Theme store — holds the active mode + resolved palette, and persists the
// user's choice so it survives app restarts.
import { create } from 'zustand';
import { storage } from '../services/storage';
import { THEMES, ThemeColors, ThemeMode } from '../theme/themes';

const THEME_STORAGE_KEY = 'app_theme_mode';
const DEFAULT_MODE: ThemeMode = 'dark';

interface ThemeState {
  mode: ThemeMode;
  colors: ThemeColors;
  /** Bumped whenever the theme changes so the app tree can remount. */
  revision: number;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  initTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: DEFAULT_MODE,
  colors: THEMES[DEFAULT_MODE],
  revision: 0,

  setMode: (mode) => {
    set((state) => ({ mode, colors: THEMES[mode], revision: state.revision + 1 }));
    void storage.setRaw(THEME_STORAGE_KEY, mode);
  },

  toggleTheme: () => {
    const next: ThemeMode = get().mode === 'dark' ? 'light' : 'dark';
    get().setMode(next);
  },

  initTheme: async () => {
    try {
      const saved = (await storage.getRaw(THEME_STORAGE_KEY)) as ThemeMode | null;
      if (saved === 'dark' || saved === 'light') {
        set({ mode: saved, colors: THEMES[saved] });
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  },
}));
