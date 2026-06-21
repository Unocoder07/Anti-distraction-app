import { nativeAppBlocker } from "./nativeAppBlocker";
import { Platform } from "react-native";

export interface InstalledApp {
  id: string;
  name: string;
  packageName: string;
  bundleId: string;
  icon?: string;
  category: string;
  isSystemApp: boolean;
  totalTimeMs?: number;
  openCount?: number;
  lastAnalyzedAt?: number;
}

export const SHIELD_CATEGORIES = [
  "Social Media",
  "Video",
  "Gaming",
  "Other",
] as const;
export type ShieldCategory = (typeof SHIELD_CATEGORIES)[number];

const APP_ICONS: Record<string, string> = {
  "com.instagram.android": "📷",
  "com.facebook.katana": "👥",
  "com.facebook.lite": "👥",
  "com.snapchat.android": "👻",
  "com.zhiliaoapp.musically": "🎵",
  "com.ss.android.ugc.trill": "🎵",
  "com.twitter.android": "🐦",
  "com.reddit.frontpage": "🤖",
  "com.instagram.barcelona": "🧵",
  "com.google.android.youtube": "📺",
  "com.google.android.apps.youtube.music": "🎶",
  "com.netflix.mediaclient": "🎬",
  "com.amazon.avod.thirdpartyclient": "🎥",
  "in.startv.hotstar": "⭐",
  "com.tencent.ig": "🎮",
  "com.pubg.imobile": "🎮",
  "com.dts.freefireth": "🔥",
  "com.dts.freefiremax": "🔥",
  "com.activision.callofduty.shooter": "🎯",
  "com.supercell.clashofclans": "⚔️",
  "com.supercell.clashroyale": "👑",
  "com.king.candycrushsaga": "🍬",
  "com.innersloth.spacemafia": "🚀",
  "com.mojang.minecraftpe": "⛏️",
  "com.garena.game.codm": "🎯",
  "com.ea.gp.fifamobile": "⚽",
  "com.roblox.client": "🧱",
  "com.ludo.king": "🎲",
  "com.kiloo.subwaysurf": "🏃",
};

const SENSITIVE_HINTS = [
  "paytm",
  "phonepe",
  "paisa",
  "bank",
  "upi",
  "wallet",
  "paypal",
  "venmo",
  "groww",
  "zerodha",
  "coinbase",
  "binance",
  "wazirx",
];

export function packageNameToId(packageName: string): number {
  let hash = 0;
  for (let i = 0; i < packageName.length; i++) {
    hash = (hash << 5) - hash + packageName.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || 1;
}

function normalizeCategory(category?: string): ShieldCategory {
  switch ((category ?? "").toLowerCase()) {
    case "social media":
      return "Social Media";
    case "video":
      return "Video";
    case "gaming":
      return "Gaming";
    default:
      return "Other";
  }
}

function isSensitiveApp(packageName: string, appName: string): boolean {
  const haystack = `${packageName} ${appName}`.toLowerCase();
  return SENSITIVE_HINTS.some((hint) => haystack.includes(hint));
}

function iconForPackage(packageName: string): string {
  return APP_ICONS[packageName] ?? "📱";
}

export async function getRecommendedBlockingApps(): Promise<InstalledApp[]> {
  if (Platform.OS !== "android") {
    return [];
  }

  try {
    const recommended = await nativeAppBlocker.getUsageStatsRecommendations();

    return recommended
      .filter((app) => !isSensitiveApp(app.packageName, app.name))
      .map((app) => ({
        id: app.packageName,
        name: app.name,
        packageName: app.packageName,
        bundleId: app.packageName,
        icon: iconForPackage(app.packageName),
        category: normalizeCategory(app.category),
        isSystemApp: app.isSystemApp ?? false,
        totalTimeMs: app.totalTimeMs,
        openCount: app.openCount,
        lastAnalyzedAt: app.lastAnalyzedAt,
      }))
      .sort((a, b) => {
        const byCategory =
          SHIELD_CATEGORIES.indexOf(a.category as ShieldCategory) -
          SHIELD_CATEGORIES.indexOf(b.category as ShieldCategory);
        if (byCategory !== 0) return byCategory;

        const scoreA =
          (a.totalTimeMs ?? 0) + (a.openCount ?? 0) * 5 * 60 * 1000;
        const scoreB =
          (b.totalTimeMs ?? 0) + (b.openCount ?? 0) * 5 * 60 * 1000;
        if (scoreB !== scoreA) return scoreB - scoreA;

        return a.name.localeCompare(b.name);
      });
  } catch (error) {
    console.error("Error loading passive recommendations:", error);
    return [];
  }
}

export function categorizeApps(
  apps: InstalledApp[],
): Record<ShieldCategory, InstalledApp[]> {
  return {
    "Social Media": apps.filter((app) => app.category === "Social Media"),
    Video: apps.filter((app) => app.category === "Video"),
    Gaming: apps.filter((app) => app.category === "Gaming"),
    Other: apps.filter((app) => app.category === "Other"),
  };
}
