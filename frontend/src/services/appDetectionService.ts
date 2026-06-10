// App Detection Service - Detect installed apps on device
import { Linking } from 'react-native';

export interface DetectedApp {
  id: number;
  name: string;
  category: string;
  icon: string;
  logo?: string;
  blocked: boolean;
  packageName?: string; // Android
  bundleId?: string; // iOS
  urlScheme?: string; // For detection
  alternativeSchemes?: string[]; // Alternative URL schemes to try
}

// Popular apps that students commonly use (distracting + educational)
const KNOWN_APPS: Omit<DetectedApp, 'blocked'>[] = [
  // Social Media (High Distraction)
  {
    id: 1,
    name: 'Instagram',
    category: 'Social Media',
    icon: '📷',
    packageName: 'com.instagram.android',
    bundleId: 'com.burbn.instagram',
    urlScheme: 'instagram://',
    alternativeSchemes: ['instagram-stories://', 'instagram-camera://'],
  },
  {
    id: 2,
    name: 'TikTok',
    category: 'Social Media',
    icon: '🎵',
    packageName: 'com.zhiliaoapp.musically',
    bundleId: 'com.zhiliaoapp.musically',
    urlScheme: 'tiktok://',
    alternativeSchemes: ['snssdk1233://', 'snssdk1128://'],
  },
  {
    id: 3,
    name: 'Facebook',
    category: 'Social Media',
    icon: '👥',
    packageName: 'com.facebook.katana',
    bundleId: 'com.facebook.Facebook',
    urlScheme: 'fb://',
    alternativeSchemes: ['fb-messenger://', 'fbapi://'],
  },
  {
    id: 4,
    name: 'Snapchat',
    category: 'Social Media',
    icon: '👻',
    packageName: 'com.snapchat.android',
    bundleId: 'com.toyopagroup.picaboo',
    urlScheme: 'snapchat://',
  },
  {
    id: 5,
    name: 'Twitter (X)',
    category: 'Social Media',
    icon: '🐦',
    packageName: 'com.twitter.android',
    bundleId: 'com.atebits.Tweetie2',
    urlScheme: 'twitter://',
  },
  {
    id: 6,
    name: 'Reddit',
    category: 'Social Media',
    icon: '🤖',
    packageName: 'com.reddit.frontpage',
    bundleId: 'com.reddit.Reddit',
    urlScheme: 'reddit://',
  },
  
  // Messaging (Medium Distraction)
  {
    id: 7,
    name: 'WhatsApp',
    category: 'Messaging',
    icon: '💬',
    packageName: 'com.whatsapp',
    bundleId: 'net.whatsapp.WhatsApp',
    urlScheme: 'whatsapp://',
  },
  {
    id: 8,
    name: 'Telegram',
    category: 'Messaging',
    icon: '✈️',
    packageName: 'org.telegram.messenger',
    bundleId: 'ph.telegra.Telegraph',
    urlScheme: 'tg://',
  },
  {
    id: 9,
    name: 'Discord',
    category: 'Messaging',
    icon: '💬',
    packageName: 'com.discord',
    bundleId: 'com.hammerandchisel.discord',
    urlScheme: 'discord://',
  },
  
  // Video & Entertainment (High Distraction)
  {
    id: 10,
    name: 'YouTube',
    category: 'Video',
    icon: '📺',
    packageName: 'com.google.android.youtube',
    bundleId: 'com.google.ios.youtube',
    urlScheme: 'youtube://',
  },
  {
    id: 11,
    name: 'Netflix',
    category: 'Entertainment',
    icon: '🎬',
    packageName: 'com.netflix.mediaclient',
    bundleId: 'com.netflix.Netflix',
    urlScheme: 'nflx://',
  },
  {
    id: 12,
    name: 'Prime Video',
    category: 'Entertainment',
    icon: '🎥',
    packageName: 'com.amazon.avod.thirdpartyclient',
    bundleId: 'com.amazon.aiv.AIVApp',
    urlScheme: 'primevideo://',
  },
  {
    id: 13,
    name: 'Hotstar',
    category: 'Entertainment',
    icon: '⭐',
    packageName: 'in.startv.hotstar',
    bundleId: 'in.startv.hotstar',
    urlScheme: 'hotstar://',
  },
  {
    id: 14,
    name: 'Twitch',
    category: 'Video',
    icon: '🎮',
    packageName: 'tv.twitch.android.app',
    bundleId: 'tv.twitch',
    urlScheme: 'twitch://',
  },
  
  // Gaming (High Distraction)
  {
    id: 15,
    name: 'PUBG Mobile',
    category: 'Gaming',
    icon: '🎮',
    packageName: 'com.tencent.ig',
    bundleId: 'com.tencent.ig',
    urlScheme: 'pubgm://',
  },
  {
    id: 16,
    name: 'Free Fire',
    category: 'Gaming',
    icon: '🔥',
    packageName: 'com.dts.freefireth',
    bundleId: 'com.dts.freefireth',
    urlScheme: 'freefire://',
  },
  {
    id: 17,
    name: 'Call of Duty Mobile',
    category: 'Gaming',
    icon: '🎯',
    packageName: 'com.activision.callofduty.shooter',
    bundleId: 'com.activision.callofduty.shooter',
    urlScheme: 'codm://',
  },
  {
    id: 18,
    name: 'Clash of Clans',
    category: 'Gaming',
    icon: '⚔️',
    packageName: 'com.supercell.clashofclans',
    bundleId: 'com.supercell.magic',
    urlScheme: 'clashofclans://',
  },
  {
    id: 19,
    name: 'Candy Crush',
    category: 'Gaming',
    icon: '🍬',
    packageName: 'com.king.candycrushsaga',
    bundleId: 'com.midasplayer.apps.candycrushsaga',
    urlScheme: 'candycrush://',
  },
  {
    id: 20,
    name: 'Among Us',
    category: 'Gaming',
    icon: '🚀',
    packageName: 'com.innersloth.spacemafia',
    bundleId: 'com.innersloth.amongus',
    urlScheme: 'amongus://',
  },
  
  // Shopping (Medium Distraction)
  {
    id: 21,
    name: 'Amazon',
    category: 'Shopping',
    icon: '🛒',
    packageName: 'com.amazon.mShop.android.shopping',
    bundleId: 'com.amazon.Amazon',
    urlScheme: 'amazon://',
  },
  {
    id: 22,
    name: 'Flipkart',
    category: 'Shopping',
    icon: '🛍️',
    packageName: 'com.flipkart.android',
    bundleId: 'com.flipkart.app',
    urlScheme: 'flipkart://',
  },
  {
    id: 23,
    name: 'Myntra',
    category: 'Shopping',
    icon: '👗',
    packageName: 'com.myntra.android',
    bundleId: 'com.myntra.Myntra',
    urlScheme: 'myntra://',
  },
  
  // Dating (High Distraction)
  {
    id: 24,
    name: 'Tinder',
    category: 'Dating',
    icon: '❤️',
    packageName: 'com.tinder',
    bundleId: 'com.cardify.tinder',
    urlScheme: 'tinder://',
  },
  {
    id: 25,
    name: 'Bumble',
    category: 'Dating',
    icon: '💛',
    packageName: 'com.bumble.app',
    bundleId: 'com.bumble.app',
    urlScheme: 'bumble://',
  },
  
  // News & Media (Low Distraction - but can be time-consuming)
  {
    id: 26,
    name: 'Inshorts',
    category: 'News',
    icon: '📰',
    packageName: 'com.nis.app',
    bundleId: 'com.nis.app',
    urlScheme: 'inshorts://',
  },
  {
    id: 27,
    name: 'Dailyhunt',
    category: 'News',
    icon: '📱',
    packageName: 'com.eterno',
    bundleId: 'com.eterno.dailyhunt',
    urlScheme: 'dailyhunt://',
  },
  
  // Music (Low Distraction)
  {
    id: 28,
    name: 'Spotify',
    category: 'Music',
    icon: '🎵',
    packageName: 'com.spotify.music',
    bundleId: 'com.spotify.client',
    urlScheme: 'spotify://',
  },
  {
    id: 29,
    name: 'YouTube Music',
    category: 'Music',
    icon: '🎶',
    packageName: 'com.google.android.apps.youtube.music',
    bundleId: 'com.google.ios.youtubemusic',
    urlScheme: 'youtubemusic://',
  },
  {
    id: 30,
    name: 'Gaana',
    category: 'Music',
    icon: '🎧',
    packageName: 'com.gaana',
    bundleId: 'com.gaana.app',
    urlScheme: 'gaana://',
  },
];

class AppDetectionService {
  /**
   * Detect which apps are installed on the device
   * Note: This uses URL schemes which is limited but works without native modules
   */
  async detectInstalledApps(): Promise<DetectedApp[]> {
    const installedApps: DetectedApp[] = [];

    console.log('🔍 Detecting installed apps...');

    for (const app of KNOWN_APPS) {
      let isInstalled = false;
      
      // Try primary URL scheme
      if (app.urlScheme) {
        isInstalled = await this.isAppInstalled(app.urlScheme);
      }
      
      // If not found, try alternative schemes
      if (!isInstalled && app.alternativeSchemes) {
        for (const altScheme of app.alternativeSchemes) {
          isInstalled = await this.isAppInstalled(altScheme);
          if (isInstalled) {
            console.log(`✅ Found: ${app.name} (via ${altScheme})`);
            break;
          }
        }
      }
      
      if (isInstalled) {
        if (!app.alternativeSchemes || app.urlScheme) {
          console.log(`✅ Found: ${app.name}`);
        }
        installedApps.push({
          ...app,
          blocked: false, // Default to not blocked
        });
      }
    }

    console.log(`📱 Total apps detected: ${installedApps.length} out of ${KNOWN_APPS.length}`);

    // Return only installed apps (no fallback to all apps)
    return installedApps;
  }

  /**
   * Check if an app is installed using URL scheme
   * Note: This is limited and may not work for all apps
   */
  private async isAppInstalled(urlScheme: string): Promise<boolean> {
    if (!urlScheme) return false;

    try {
      const canOpen = await Linking.canOpenURL(urlScheme);
      return canOpen;
    } catch (error) {
      // URL scheme check failed, assume not installed
      return false;
    }
  }

  /**
   * Get all known apps (for display even if not installed)
   */
  getAllKnownApps(): DetectedApp[] {
    return KNOWN_APPS.map(app => ({ ...app, blocked: false }));
  }

  /**
   * Get apps by category
   */
  getAppsByCategory(category: string): DetectedApp[] {
    return KNOWN_APPS
      .filter(app => app.category === category)
      .map(app => ({ ...app, blocked: false }));
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    const categories = new Set(KNOWN_APPS.map(app => app.category));
    return Array.from(categories);
  }

  /**
   * Search apps by name
   */
  searchApps(query: string): DetectedApp[] {
    const lowerQuery = query.toLowerCase();
    return KNOWN_APPS
      .filter(app => app.name.toLowerCase().includes(lowerQuery))
      .map(app => ({ ...app, blocked: false }));
  }

  /**
   * Add custom app manually
   */
  createCustomApp(
    name: string,
    category: string,
    packageName?: string,
    bundleId?: string
  ): DetectedApp {
    return {
      id: Date.now(), // Use timestamp as unique ID
      name,
      category,
      icon: '📱',
      blocked: false,
      packageName,
      bundleId,
    };
  }

  /**
   * Get app detection method info
   */
  getDetectionInfo(): {
    method: string;
    limitations: string[];
    recommendation: string;
  } {
    return {
      method: 'URL Scheme Detection',
      limitations: [
        'Cannot detect all installed apps',
        'Some apps may not have URL schemes',
        'iOS restricts URL scheme queries',
        'Requires app to be configured in Info.plist (iOS)',
      ],
      recommendation:
        'For production, consider using native modules like react-native-installed-apps (Android) or custom native code.',
    };
  }

  /**
   * Attempt to intercept app launch (limited functionality)
   * Note: This is a placeholder - actual blocking requires native code
   */
  async attemptToOpenApp(urlScheme: string): Promise<boolean> {
    try {
      const canOpen = await Linking.canOpenURL(urlScheme);
      if (canOpen) {
        // In a real implementation, we would prevent this
        // For now, we just detect the attempt
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get student-focused app recommendations
   */
  getStudentRecommendations(): {
    highDistraction: DetectedApp[];
    mediumDistraction: DetectedApp[];
    lowDistraction: DetectedApp[];
  } {
    const allApps = this.getAllKnownApps();
    
    const highDistraction = allApps.filter(app => 
      ['Social Media', 'Gaming', 'Dating', 'Video', 'Entertainment'].includes(app.category)
    );
    
    const mediumDistraction = allApps.filter(app => 
      ['Messaging', 'Shopping'].includes(app.category)
    );
    
    const lowDistraction = allApps.filter(app => 
      ['Music', 'News'].includes(app.category)
    );

    return {
      highDistraction,
      mediumDistraction,
      lowDistraction,
    };
  }
}

export const appDetectionService = new AppDetectionService();
