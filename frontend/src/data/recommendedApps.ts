/**
 * Recommended Apps Database
 * Pre-defined list of commonly distracting apps
 */

export interface RecommendedApp {
  packageName: string;
  name: string;
  icon: string;
  category: 'Social Media' | 'Gaming' | 'Entertainment' | 'Short Video' | 'Other';
  description?: string;
}

export const RECOMMENDED_APPS: RecommendedApp[] = [
  // Social Media
  {
    packageName: 'com.instagram.android',
    name: 'Instagram',
    icon: '📸',
    category: 'Social Media',
    description: 'Photo & video sharing',
  },
  {
    packageName: 'com.facebook.katana',
    name: 'Facebook',
    icon: '👤',
    category: 'Social Media',
    description: 'Social networking',
  },
  {
    packageName: 'com.snapchat.android',
    name: 'Snapchat',
    icon: '👻',
    category: 'Social Media',
    description: 'Photo messaging',
  },
  {
    packageName: 'com.whatsapp',
    name: 'WhatsApp',
    icon: '💬',
    category: 'Social Media',
    description: 'Messaging',
  },
  {
    packageName: 'com.twitter.android',
    name: 'X (Twitter)',
    icon: '🐦',
    category: 'Social Media',
    description: 'Social news',
  },
  {
    packageName: 'com.linkedin.android',
    name: 'LinkedIn',
    icon: '💼',
    category: 'Social Media',
    description: 'Professional network',
  },
  {
    packageName: 'com.reddit.frontpage',
    name: 'Reddit',
    icon: '🤖',
    category: 'Social Media',
    description: 'Social news aggregation',
  },
  {
    packageName: 'com.pinterest',
    name: 'Pinterest',
    icon: '📌',
    category: 'Social Media',
    description: 'Visual discovery',
  },
  {
    packageName: 'com.zhiliaoapp.musically',
    name: 'TikTok',
    icon: '🎵',
    category: 'Short Video',
    description: 'Short videos',
  },

  // Gaming
  {
    packageName: 'com.pubg.imobile',
    name: 'BGMI',
    icon: '🎮',
    category: 'Gaming',
    description: 'Battle royale',
  },
  {
    packageName: 'com.dts.freefireth',
    name: 'Free Fire',
    icon: '🔥',
    category: 'Gaming',
    description: 'Battle royale',
  },
  {
    packageName: 'com.activision.callofduty.shooter',
    name: 'Call of Duty Mobile',
    icon: '💣',
    category: 'Gaming',
    description: 'First-person shooter',
  },
  {
    packageName: 'com.supercell.clashofclans',
    name: 'Clash of Clans',
    icon: '⚔️',
    category: 'Gaming',
    description: 'Strategy game',
  },
  {
    packageName: 'com.supercell.brawlstars',
    name: 'Brawl Stars',
    icon: '⭐',
    category: 'Gaming',
    description: 'Action game',
  },
  {
    packageName: 'com.tencent.ig',
    name: 'PUBG Mobile',
    icon: '🎯',
    category: 'Gaming',
    description: 'Battle royale',
  },
  {
    packageName: 'com.ea.gp.fifamobile',
    name: 'FIFA Mobile',
    icon: '⚽',
    category: 'Gaming',
    description: 'Football game',
  },
  {
    packageName: 'com.king.candycrushsaga',
    name: 'Candy Crush',
    icon: '🍬',
    category: 'Gaming',
    description: 'Puzzle game',
  },
  {
    packageName: 'com.mojang.minecraftpe',
    name: 'Minecraft',
    icon: '🧱',
    category: 'Gaming',
    description: 'Sandbox game',
  },
  {
    packageName: 'com.roblox.client',
    name: 'Roblox',
    icon: '🎲',
    category: 'Gaming',
    description: 'Gaming platform',
  },

  // Entertainment
  {
    packageName: 'com.google.android.youtube',
    name: 'YouTube',
    icon: '▶️',
    category: 'Entertainment',
    description: 'Video streaming',
  },
  {
    packageName: 'com.netflix.mediaclient',
    name: 'Netflix',
    icon: '🎬',
    category: 'Entertainment',
    description: 'Streaming service',
  },
  {
    packageName: 'com.amazon.avod.thirdpartyclient',
    name: 'Prime Video',
    icon: '📺',
    category: 'Entertainment',
    description: 'Streaming service',
  },
  {
    packageName: 'com.spotify.music',
    name: 'Spotify',
    icon: '🎧',
    category: 'Entertainment',
    description: 'Music streaming',
  },
  {
    packageName: 'com.discord',
    name: 'Discord',
    icon: '💬',
    category: 'Entertainment',
    description: 'Chat & voice',
  },
  {
    packageName: 'tv.twitch.android.app',
    name: 'Twitch',
    icon: '📡',
    category: 'Entertainment',
    description: 'Live streaming',
  },
];

/**
 * Get apps by category
 */
export function getAppsByCategory(category: RecommendedApp['category']): RecommendedApp[] {
  return RECOMMENDED_APPS.filter(app => app.category === category);
}

/**
 * Get all categories
 */
export function getCategories(): RecommendedApp['category'][] {
  return ['Social Media', 'Gaming', 'Entertainment', 'Short Video', 'Other'];
}

/**
 * Search apps
 */
export function searchApps(query: string): RecommendedApp[] {
  const lowerQuery = query.toLowerCase();
  return RECOMMENDED_APPS.filter(
    app =>
      app.name.toLowerCase().includes(lowerQuery) ||
      app.description?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get app by package name
 */
export function getAppByPackage(packageName: string): RecommendedApp | undefined {
  return RECOMMENDED_APPS.find(app => app.packageName === packageName);
}
