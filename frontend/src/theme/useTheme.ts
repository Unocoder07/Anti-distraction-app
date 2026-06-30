// Theme hooks — the single entry point components use to read theme values.
//
// Usage in a component:
//   const COLORS = useTheme();
//   const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
import { useThemeStore } from '../store/themeStore';
import { ThemeColors, ThemeMode } from './themes';

/** Returns the active color palette. Re-renders the caller on theme change. */
export const useTheme = (): ThemeColors => useThemeStore((s) => s.colors);

/** Returns the active theme mode ('dark' | 'light'). */
export const useThemeMode = (): ThemeMode => useThemeStore((s) => s.mode);

/** Toggle between dark and light. */
export const useToggleTheme = (): (() => void) => useThemeStore((s) => s.toggleTheme);
