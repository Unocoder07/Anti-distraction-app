// Static dark palette — kept for backward compatibility.
//
// New code should read colors from the centralized theme via `useTheme()`
// (see src/theme). This constant is the dark palette and stays available so
// non-themed / pre-login surfaces and any not-yet-migrated module still work.
import { darkColors } from '../theme/themes';

export const COLORS = darkColors;
