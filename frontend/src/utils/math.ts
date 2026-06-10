/**
 * Calculate percentage with optional decimal places
 */
export function calculatePercentage(
  current: number,
  total: number,
  decimals: number = 0
): number {
  if (total === 0) return 0;
  const percent = (current / total) * 100;
  return Number(percent.toFixed(decimals));
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Map a value from one range to another
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/**
 * Round to nearest multiple
 */
export function roundToNearest(value: number, multiple: number): number {
  return Math.round(value / multiple) * multiple;
}

/**
 * Format number with thousands separator
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Calculate XP needed for next level
 * Uses exponential curve: baseXP * (level ^ exponent)
 */
export function calculateXPForLevel(
  level: number,
  baseXP: number = 100,
  exponent: number = 1.5
): number {
  return Math.floor(baseXP * Math.pow(level, exponent));
}

/**
 * Calculate level from total XP
 */
export function calculateLevelFromXP(
  totalXP: number,
  baseXP: number = 100,
  exponent: number = 1.5
): number {
  let level = 1;
  let xpRequired = 0;

  while (xpRequired <= totalXP) {
    level++;
    xpRequired += calculateXPForLevel(level, baseXP, exponent);
  }

  return level - 1;
}
