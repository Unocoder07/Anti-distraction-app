// Centralized theme palettes.
//
// Every component pulls its colors from here via `useTheme()` so a single
// toggle re-themes the whole app. Both palettes share the SAME set of keys
// (see `ThemeColors`) — that's what lets a component swap themes without any
// per-color branching.

export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  background: string;
  surface: string;
  card: string;

  primary: string;
  secondary: string;

  success: string;
  warning: string;
  danger: string;
  error: string;

  text: string;
  textSecondary: string;

  border: string;

  /** Readable foreground to place ON TOP of a `primary`-filled surface. */
  onPrimary: string;
}

// ── Dark theme (the original design — kept unchanged) ──────────────────────────
export const darkColors: ThemeColors = {
  background: '#020617',
  surface: '#0f172a',
  card: '#1e293b',

  primary: '#14b8a6',
  secondary: '#3b82f6',

  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  error: '#ef4444',

  text: '#ffffff',
  textSecondary: '#94a3b8',

  border: '#334155',

  onPrimary: '#020617',
};

// ── Light theme (new — tuned for contrast & readability) ───────────────────────
export const lightColors: ThemeColors = {
  background: '#f1f5f9', // slate-100 — soft off-white page
  surface: '#ffffff', // cards / sheets
  card: '#e2e8f0', // slate-200 — subtle raised tiles

  primary: '#0d9488', // teal-600 — darker so it reads on white
  secondary: '#2563eb', // blue-600

  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
  error: '#dc2626',

  text: '#0f172a', // slate-900
  textSecondary: '#64748b', // slate-500

  border: '#cbd5e1', // slate-300

  onPrimary: '#ffffff',
};

export const THEMES: Record<ThemeMode, ThemeColors> = {
  dark: darkColors,
  light: lightColors,
};
