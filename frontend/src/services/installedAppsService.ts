// Service to detect distracting apps actually installed on the student's device
import { Platform } from 'react-native';
import { nativeAppBlocker } from './nativeAppBlocker';

export interface InstalledApp {
  id: string;
  name: string;
  packageName: string;
  bundleId: string;
  icon?: string;
  category: string;
  isSystemApp: boolean;
}

/** Categories shown on the Shield page */
export const SHIELD_CATEGORIES = ['Social Media', 'Video', 'Gaming'] as const;
export type ShieldCategory = (typeof SHIELD_CATEGORIES)[number];

/** Known distracting apps — used only to match against what is installed */
const KNOWN_DISTRACTING_APPS: Array<{
  packageName: string;
  name: string;
  category: ShieldCategory;
  icon: string;
}> = [
  // Social Media
  { packageName: 'com.instagram.android', name: 'Instagram', category: 'Social Media', icon: '📷' },
  { packageName: 'com.facebook.katana', name: 'Facebook', category: 'Social Media', icon: '👥' },
  { packageName: 'com.facebook.lite', name: 'Facebook Lite', category: 'Social Media', icon: '👥' },
  { packageName: 'com.snapchat.android', name: 'Snapchat', category: 'Social Media', icon: '👻' },
  { packageName: 'com.zhiliaoapp.musically', name: 'TikTok', category: 'Social Media', icon: '🎵' },
  { packageName: 'com.ss.android.ugc.trill', name: 'TikTok Lite', category: 'Social Media', icon: '🎵' },
  { packageName: 'com.twitter.android', name: 'X (Twitter)', category: 'Social Media', icon: '🐦' },
  { packageName: 'com.reddit.frontpage', name: 'Reddit', category: 'Social Media', icon: '🤖' },
  { packageName: 'com.pinterest', name: 'Pinterest', category: 'Social Media', icon: '📌' },
  { packageName: 'com.linkedin.android', name: 'LinkedIn', category: 'Social Media', icon: '💼' },
  { packageName: 'com.instagram.barcelona', name: 'Threads', category: 'Social Media', icon: '🧵' },
  // Video
  { packageName: 'com.google.android.youtube', name: 'YouTube', category: 'Video', icon: '📺' },
  { packageName: 'com.google.android.apps.youtube.music', name: 'YouTube Music', category: 'Video', icon: '🎶' },
  { packageName: 'com.netflix.mediaclient', name: 'Netflix', category: 'Video', icon: '🎬' },
  { packageName: 'com.amazon.avod.thirdpartyclient', name: 'Prime Video', category: 'Video', icon: '🎥' },
  { packageName: 'in.startv.hotstar', name: 'Hotstar', category: 'Video', icon: '⭐' },
  // Gaming
  { packageName: 'com.tencent.ig', name: 'PUBG Mobile', category: 'Gaming', icon: '🎮' },
  { packageName: 'com.dts.freefireth', name: 'Free Fire', category: 'Gaming', icon: '🔥' },
  { packageName: 'com.dts.freefiremax', name: 'Free Fire MAX', category: 'Gaming', icon: '🔥' },
  { packageName: 'com.activision.callofduty.shooter', name: 'Call of Duty', category: 'Gaming', icon: '🎯' },
  { packageName: 'com.supercell.clashofclans', name: 'Clash of Clans', category: 'Gaming', icon: '⚔️' },
  { packageName: 'com.supercell.clashroyale', name: 'Clash Royale', category: 'Gaming', icon: '👑' },
  { packageName: 'com.king.candycrushsaga', name: 'Candy Crush', category: 'Gaming', icon: '🍬' },
  { packageName: 'com.innersloth.spacemafia', name: 'Among Us', category: 'Gaming', icon: '🚀' },
  { packageName: 'com.mojang.minecraftpe', name: 'Minecraft', category: 'Gaming', icon: '⛏️' },
  { packageName: 'com.garena.game.codm', name: 'COD Mobile', category: 'Gaming', icon: '🎯' },
  { packageName: 'com.ea.gp.fifamobile', name: 'EA FC Mobile', category: 'Gaming', icon: '⚽' },
  { packageName: 'com.roblox.client', name: 'Roblox', category: 'Gaming', icon: '🧱' },
  { packageName: 'com.pubg.imobile', name: 'BGMI', category: 'Gaming', icon: '🎮' },
  { packageName: 'com.ludo.king', name: 'Ludo King', category: 'Gaming', icon: '🎲' },
  { packageName: 'com.kiloo.subwaysurf', name: 'Subway Surfers', category: 'Gaming', icon: '🏃' },
];

const GAMING_PACKAGE_HINTS = ['game', 'pubg', 'freefire', 'clash', 'candy', 'roblox', 'minecraft', 'ludo'];
const SOCIAL_PACKAGE_HINTS = ['instagram', 'facebook', 'snapchat', 'tiktok', 'twitter', 'reddit', 'threads'];
const VIDEO_PACKAGE_HINTS = ['youtube', 'netflix', 'hotstar', 'primevideo', 'spotify'];

/**
 * Stable numeric ID from package name (used for backend compatibility)
 */
export function packageNameToId(packageName: string): number {
  let hash = 0;
  for (let i = 0; i < packageName.length; i++) {
    hash = (hash << 5) - hash + packageName.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || 1;
}

function classifyUnknownApp(packageName: string, appName: string): ShieldCategory | null {
  const lower = packageName.toLowerCase();
  const nameLower = appName.toLowerCase();

  if (SOCIAL_PACKAGE_HINTS.some((hint) => lower.includes(hint) || nameLower.includes(hint))) {
    return 'Social Media';
  }

  if (VIDEO_PACKAGE_HINTS.some((hint) => lower.includes(hint) || nameLower.includes(hint))) {
    return 'Video';
  }

  if (GAMING_PACKAGE_HINTS.some((hint) => lower.includes(hint) || nameLower.includes(hint))) {
    return 'Gaming';
  }

  return null;
}

function getIconForPackage(packageName: string): string {
  const known = KNOWN_DISTRACTING_APPS.find((a) => a.packageName === packageName);
  return known?.icon ?? '📱';
}

/**
 * Returns only social media & gaming apps that are installed on this device.
 * Never returns mock or hardcoded apps that are not installed.
 */
export async function getRecommendedBlockingApps(): Promise<InstalledApp[]> {
  if (Platform.OS !== 'android') {
    return [];
  }

  try {
    const installedOnDevice = await nativeAppBlocker.getInstalledApps();

    if (!installedOnDevice || installedOnDevice.length === 0) {
      console.log('⚠️ Native app detection unavailable — build with: npx expo run:android');
      return [];
    }

    const installedPackages = new Set(
      installedOnDevice.map((app: { packageName: string }) => app.packageName)
    );

    const matched: InstalledApp[] = [];

    // 1. Match known distracting apps that are installed
    for (const known of KNOWN_DISTRACTING_APPS) {
      if (!installedPackages.has(known.packageName)) continue;

      const deviceApp = installedOnDevice.find(
        (a: { packageName: string }) => a.packageName === known.packageName
      );

      matched.push({
        id: known.packageName,
        name: deviceApp?.name ?? known.name,
        packageName: known.packageName,
        bundleId: known.packageName,
        icon: known.icon,
        category: known.category,
        isSystemApp: deviceApp?.isSystemApp ?? false,
      });
    }

    // 2. Detect additional social/gaming apps by package/name patterns
    for (const app of installedOnDevice) {
      if (matched.some((m) => m.packageName === app.packageName)) continue;

      const category = classifyUnknownApp(app.packageName, app.name);
      if (!category) continue;

      matched.push({
        id: app.packageName,
        name: app.name,
        packageName: app.packageName,
        bundleId: app.packageName,
        icon: getIconForPackage(app.packageName),
        category,
        isSystemApp: app.isSystemApp ?? false,
      });
    }

    // Sort: Social Media first, then Gaming, then alphabetically
    matched.sort((a, b) => {
      const catOrder = SHIELD_CATEGORIES.indexOf(a.category as ShieldCategory) -
        SHIELD_CATEGORIES.indexOf(b.category as ShieldCategory);
      if (catOrder !== 0) return catOrder;
      return a.name.localeCompare(b.name);
    });

    console.log(`✅ Shield: ${matched.length} installed distracting apps found`);
    return matched;
  } catch (error) {
    console.error('Error scanning installed apps:', error);
    return [];
  }
}

/** @deprecated Use getRecommendedBlockingApps */
export async function getAllInstalledApps(): Promise<InstalledApp[]> {
  return getRecommendedBlockingApps();
}

export function categorizeApps(apps: InstalledApp[]): Record<ShieldCategory, InstalledApp[]> {
  return {
    'Social Media': apps.filter((a) => a.category === 'Social Media'),
    Video: apps.filter((a) => a.category === 'Video'),
    Gaming: apps.filter((a) => a.category === 'Gaming'),
  };
}
