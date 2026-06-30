import { nativeAppBlocker } from "./nativeAppBlocker";
import { nativeBlockingService } from "./nativeBlockingService";
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
  "Entertainment",
  "Gaming",
  "Short Video",
  "Other",
] as const;
export type ShieldCategory = (typeof SHIELD_CATEGORIES)[number];
const DISTRACTION_CATEGORIES: ShieldCategory[] = [
  "Social Media",
  "Entertainment",
  "Gaming",
  "Short Video",
];

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
  "com.whatsapp": "💬",
  "org.telegram.messenger": "✈️",
  "com.linkedin.android": "💼",
  "com.pinterest": "📌",
  "com.spotify.music": "🎧",
  "com.discord": "🎮",
  "tv.twitch.android.app": "📡",
  "com.supercell.brawlstars": "⭐",
  "com.google.android.apps.nbu.paisa.user": "💰",
  "net.one97.paytm": "💳",
  "com.phonepe.app": "💸",
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

const BACKGROUND_PACKAGE_NAMES = new Set([
  "com.facebook.appmanager",
  "com.facebook.services",
  "com.facebook.system",
]);

const BACKGROUND_APP_NAME_HINTS = [
  "meta app installer",
  "meta app manager",
  "meta services",
  "facebook app installer",
  "facebook app manager",
  "facebook services",
];

const PACKAGE_CATEGORIES: Record<string, ShieldCategory> = {
  "com.instagram.android": "Social Media",
  "com.facebook.katana": "Social Media",
  "com.facebook.lite": "Social Media",
  "com.snapchat.android": "Social Media",
  "com.twitter.android": "Social Media",
  "com.x.android": "Social Media",
  "com.reddit.frontpage": "Social Media",
  "com.instagram.barcelona": "Social Media",
  "com.whatsapp": "Social Media",
  "org.telegram.messenger": "Social Media",
  "com.linkedin.android": "Social Media",
  "com.pinterest": "Social Media",
  "com.discord": "Entertainment",
  "com.zhiliaoapp.musically": "Short Video",
  "com.ss.android.ugc.trill": "Short Video",
  "com.google.android.youtube": "Entertainment",
  "com.google.android.apps.youtube.kids": "Entertainment",
  "com.google.android.apps.youtube.music": "Entertainment",
  "com.netflix.mediaclient": "Entertainment",
  "com.amazon.avod.thirdpartyclient": "Entertainment",
  "in.startv.hotstar": "Entertainment",
  "com.spotify.music": "Entertainment",
  "tv.twitch.android.app": "Entertainment",
  "com.tencent.ig": "Gaming",
  "com.pubg.imobile": "Gaming",
  "com.dts.freefireth": "Gaming",
  "com.dts.freefiremax": "Gaming",
  "com.activision.callofduty.shooter": "Gaming",
  "com.supercell.clashofclans": "Gaming",
  "com.supercell.clashroyale": "Gaming",
  "com.supercell.brawlstars": "Gaming",
  "com.king.candycrushsaga": "Gaming",
  "com.innersloth.spacemafia": "Gaming",
  "com.mojang.minecraftpe": "Gaming",
  "com.garena.game.codm": "Gaming",
  "com.ea.gp.fifamobile": "Gaming",
  "com.roblox.client": "Gaming",
  "com.ludo.king": "Gaming",
  "com.kiloo.subwaysurf": "Gaming",
};

const CATEGORY_KEYWORDS: Record<Exclude<ShieldCategory, "Other">, string[]> = {
  "Social Media": [
    "instagram",
    "facebook",
    "snapchat",
    "twitter",
    "reddit",
    "threads",
    "whatsapp",
    "telegram",
    "pinterest",
    "social",
  ],
  Entertainment: [
    "youtube",
    "netflix",
    "primevideo",
    "prime video",
    "hotstar",
    "disney",
    "spotify",
    "twitch",
    "video",
    "stream",
  ],
  Gaming: [
    "game",
    "gaming",
    "pubg",
    "bgmi",
    "freefire",
    "clash",
    "candycrush",
    "roblox",
    "minecraft",
    "ludo",
    "subway",
    "supercell",
  ],
  "Short Video": [
    "tiktok",
    "musically",
    "reels",
    "shorts",
    "moj",
    "josh",
    "roposo",
    "sharechat",
  ],
};

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
    case "entertainment":
    case "video":
      return "Entertainment";
    case "gaming":
      return "Gaming";
    case "short video":
      return "Short Video";
    default:
      return "Other";
  }
}

function inferCategory(packageName: string, appName: string, category?: string): ShieldCategory {
  const normalized = normalizeCategory(category);
  if (normalized !== "Other") return normalized;

  const knownCategory = PACKAGE_CATEGORIES[packageName];
  if (knownCategory) return knownCategory;

  const haystack = `${packageName} ${appName}`.toLowerCase();
  for (const [candidate, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      return candidate as Exclude<ShieldCategory, "Other">;
    }
  }

  return "Other";
}

function isDistractingCategory(category: string): boolean {
  return DISTRACTION_CATEGORIES.includes(category as ShieldCategory);
}

function isBackgroundPackage(packageName: string, appName: string): boolean {
  const normalizedPackage = packageName.toLowerCase();
  const normalizedName = appName.toLowerCase();

  return (
    BACKGROUND_PACKAGE_NAMES.has(normalizedPackage) ||
    BACKGROUND_APP_NAME_HINTS.some((hint) => normalizedName.includes(hint))
  );
}

async function isSensitiveApp(packageName: string, appName: string): Promise<boolean> {
  const haystack = `${packageName} ${appName}`.toLowerCase();
  if (SENSITIVE_HINTS.some((hint) => haystack.includes(hint))) {
    return true;
  }

  return nativeBlockingService.isSensitiveApp(packageName);
}

function iconForPackage(packageName: string): string {
  return APP_ICONS[packageName] ?? "📱";
}

/**
 * Get recommended blocking apps — uses installed apps from device
 * Falls back to curated recommended apps if native module unavailable
 */
export async function getRecommendedBlockingApps(): Promise<InstalledApp[]> {
  if (Platform.OS !== "android") {
    return [];
  }

  try {
    // First try to get installed apps from device (with categories from native)
    const installedApps = await nativeAppBlocker.getInstalledApps();

    if (installedApps && installedApps.length > 0) {
      return (
        await Promise.all(
          installedApps.map(async (app) => ({
            app,
            sensitive: await isSensitiveApp(app.packageName, app.name),
          })),
        )
      )
        .filter(({ app, sensitive }) => !sensitive && !isBackgroundPackage(app.packageName, app.name))
        .map(({ app }) => app)
        .map((app) => ({
          id: app.packageName,
          name: app.name,
          packageName: app.packageName,
          bundleId: app.packageName,
          icon: app.icon || iconForPackage(app.packageName),
          category: inferCategory(app.packageName, app.name, app.category),
          isSystemApp: app.isSystemApp ?? false,
          totalTimeMs: app.totalTimeMs,
          openCount: app.openCount,
          lastAnalyzedAt: app.lastAnalyzedAt,
        }))
        .filter((app) => isDistractingCategory(app.category))
        .sort((a, b) => {
          const byCategory =
            SHIELD_CATEGORIES.indexOf(a.category as ShieldCategory) -
            SHIELD_CATEGORIES.indexOf(b.category as ShieldCategory);
          if (byCategory !== 0) return byCategory;
          return a.name.localeCompare(b.name);
        });
    }

    // Fallback: try usage stats recommendations
    const recommended = await nativeAppBlocker.getUsageStatsRecommendations();
    if (recommended && recommended.length > 0) {
      return (
        await Promise.all(
          recommended.map(async (app) => ({
            app,
            sensitive: await isSensitiveApp(app.packageName, app.name),
          })),
        )
      )
        .filter(({ app, sensitive }) => !sensitive && !isBackgroundPackage(app.packageName, app.name))
        .map(({ app }) => app)
        .map((app) => ({
          id: app.packageName,
          name: app.name,
          packageName: app.packageName,
          bundleId: app.packageName,
          icon: app.icon || iconForPackage(app.packageName),
          category: inferCategory(app.packageName, app.name, app.category),
          isSystemApp: app.isSystemApp ?? false,
          totalTimeMs: app.totalTimeMs,
          openCount: app.openCount,
          lastAnalyzedAt: app.lastAnalyzedAt,
        }))
        .filter((app) => isDistractingCategory(app.category))
        .sort((a, b) => {
          const byCategory =
            SHIELD_CATEGORIES.indexOf(a.category as ShieldCategory) -
            SHIELD_CATEGORIES.indexOf(b.category as ShieldCategory);
          if (byCategory !== 0) return byCategory;
          return a.name.localeCompare(b.name);
        });
    }

    return [];
  } catch (error) {
    console.error("Error loading installed apps:", error);
    return [];
  }
}

export function categorizeApps(
  apps: InstalledApp[],
): Record<ShieldCategory, InstalledApp[]> {
  return {
    "Social Media": apps.filter((app) => app.category === "Social Media"),
    Entertainment: apps.filter((app) => app.category === "Entertainment"),
    Gaming: apps.filter((app) => app.category === "Gaming"),
    "Short Video": apps.filter((app) => app.category === "Short Video"),
    Other: apps.filter((app) => app.category === "Other"),
  };
}
