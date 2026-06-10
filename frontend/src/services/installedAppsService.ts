// Service to get ALL installed apps on device
import { Platform } from 'react-native';
import { nativeAppBlocker } from './nativeAppBlocker';

export interface InstalledApp {
  id: string;
  name: string;
  packageName: string; // Android: com.instagram.android
  bundleId: string;    // iOS: com.burbn.instagram
  icon?: string;
  category: string;
  isSystemApp: boolean;
}

/**
 * Get all installed apps on the device
 * Only returns apps that are actually installed on the student's phone
 */
export async function getAllInstalledApps(): Promise<InstalledApp[]> {
  try {
    if (Platform.OS === 'android') {
      try {
        console.log('🔍 Scanning device for installed apps using native module...');
        
        // Use our own native module first as it's more reliable than 3rd party
        const installedApps = await nativeAppBlocker.getInstalledApps();
        
        if (!installedApps || installedApps.length === 0) {
          console.log('⚠️ Native module returned 0 apps, checking Expo Go fallback...');
          throw new Error('No apps found or native module missing');
        }

        console.log(`📱 Found ${installedApps.length} total apps on device`);
        
        // Filter and format the apps
        const formattedApps: InstalledApp[] = installedApps.map((app, index) => ({
          id: String(index),
          name: app.name,
          packageName: app.packageName,
          bundleId: app.packageName, // Android doesn't use bundleId
          icon: getIconForPackage(app.packageName),
          category: getCategoryForPackage(app.packageName),
          isSystemApp: app.isSystemApp
        }));

        // Match with common distracting apps list for better UI
        const commonApps = getCommonStudentApps();
        const matchedApps = formattedApps.filter(app => 
          commonApps.some(known => known.packageName === app.packageName)
        );

        console.log(`✅ Found ${matchedApps.length} distracting apps installed on device`);
        return matchedApps.length > 0 ? matchedApps : formattedApps.slice(0, 10);
      } catch (nativeError) {
        console.log('⚠️ App detection disabled - Expo Go detected');
        console.log('💡 Tip: Use a "Development Build" (npx expo run:android) to enable native app detection');
        
        // Fallback for Expo Go
        return getMockInstalledApps();
      }
    }
    
    // iOS - return empty for now
    return [];
  } catch (error) {
    console.error('Error getting installed apps:', error);
    return [];
  }
}

/**
 * Mock apps to show in Expo Go since native detection is disabled there
 */
function getMockInstalledApps(): InstalledApp[] {
  return [
    {
      id: '1',
      name: 'Instagram',
      packageName: 'com.instagram.android',
      bundleId: 'com.burbn.instagram',
      icon: '📷',
      category: 'Social Media',
      isSystemApp: false
    },
    {
      id: '2',
      name: 'WhatsApp',
      packageName: 'com.whatsapp',
      bundleId: 'net.whatsapp.WhatsApp',
      icon: '💬',
      category: 'Communication',
      isSystemApp: false
    },
    {
      id: '3',
      name: 'YouTube',
      packageName: 'com.google.android.youtube',
      bundleId: 'com.google.ios.youtube',
      icon: '📺',
      category: 'Entertainment',
      isSystemApp: true
    }
  ];
}

/**
 * Get icon emoji for package name
 */
function getIconForPackage(packageName: string): string {
  const iconMap: Record<string, string> = {
    'com.instagram.android': '📷',
    'com.facebook.katana': '👥',
    'com.snapchat.android': '👻',
    'com.zhiliaoapp.musically': '🎵',
    'com.twitter.android': '🐦',
    'com.reddit.frontpage': '🤖',
    'com.whatsapp': '💬',
    'org.telegram.messenger': '✈️',
    'com.discord': '💬',
    'com.google.android.youtube': '📺',
    'com.netflix.mediaclient': '🎬',
    'com.tencent.ig': '🎮',
    'com.dts.freefireth': '🔥',
  };
  
  return iconMap[packageName] || '📱';
}

/**
 * Get category for package name
 */
function getCategoryForPackage(packageName: string): string {
  if (packageName.includes('instagram') || packageName.includes('facebook') || 
      packageName.includes('snapchat') || packageName.includes('tiktok') ||
      packageName.includes('twitter') || packageName.includes('reddit')) {
    return 'Social Media';
  }
  
  if (packageName.includes('whatsapp') || packageName.includes('telegram') ||
      packageName.includes('discord') || packageName.includes('messenger')) {
    return 'Messaging';
  }
  
  if (packageName.includes('game') || packageName.includes('pubg') ||
      packageName.includes('freefire') || packageName.includes('clash') ||
      packageName.includes('candy')) {
    return 'Gaming';
  }
  
  if (packageName.includes('youtube') || packageName.includes('netflix') ||
      packageName.includes('hotstar') || packageName.includes('prime')) {
    return 'Video';
  }
  
  return 'Other';
}

/**
 * Get common apps that students typically have
 * These will be shown for blocking
 */
function getCommonStudentApps(): InstalledApp[] {
  return [
    // Social Media
    { id: '1', name: 'Instagram', packageName: 'com.instagram.android', bundleId: 'com.burbn.instagram', icon: '📷', category: 'Social Media', isSystemApp: false },
    { id: '2', name: 'Facebook', packageName: 'com.facebook.katana', bundleId: 'com.facebook.Facebook', icon: '👥', category: 'Social Media', isSystemApp: false },
    { id: '3', name: 'Snapchat', packageName: 'com.snapchat.android', bundleId: 'com.toyopagroup.picaboo', icon: '👻', category: 'Social Media', isSystemApp: false },
    { id: '4', name: 'TikTok', packageName: 'com.zhiliaoapp.musically', bundleId: 'com.zhiliaoapp.musically', icon: '🎵', category: 'Social Media', isSystemApp: false },
    { id: '5', name: 'Twitter', packageName: 'com.twitter.android', bundleId: 'com.atebits.Tweetie2', icon: '🐦', category: 'Social Media', isSystemApp: false },
    { id: '6', name: 'Reddit', packageName: 'com.reddit.frontpage', bundleId: 'com.reddit.Reddit', icon: '🤖', category: 'Social Media', isSystemApp: false },
    
    // Messaging
    { id: '7', name: 'WhatsApp', packageName: 'com.whatsapp', bundleId: 'net.whatsapp.WhatsApp', icon: '💬', category: 'Messaging', isSystemApp: false },
    { id: '8', name: 'Telegram', packageName: 'org.telegram.messenger', bundleId: 'ph.telegra.Telegraph', icon: '✈️', category: 'Messaging', isSystemApp: false },
    { id: '9', name: 'Discord', packageName: 'com.discord', bundleId: 'com.hammerandchisel.discord', icon: '💬', category: 'Messaging', isSystemApp: false },
    
    // Video & Entertainment
    { id: '10', name: 'YouTube', packageName: 'com.google.android.youtube', bundleId: 'com.google.ios.youtube', icon: '📺', category: 'Video', isSystemApp: false },
    { id: '11', name: 'Netflix', packageName: 'com.netflix.mediaclient', bundleId: 'com.netflix.Netflix', icon: '🎬', category: 'Entertainment', isSystemApp: false },
    { id: '12', name: 'Prime Video', packageName: 'com.amazon.avod.thirdpartyclient', bundleId: 'com.amazon.aiv.AIVApp', icon: '🎥', category: 'Entertainment', isSystemApp: false },
    { id: '13', name: 'Hotstar', packageName: 'in.startv.hotstar', bundleId: 'in.startv.hotstar', icon: '⭐', category: 'Entertainment', isSystemApp: false },
    
    // Gaming
    { id: '14', name: 'PUBG Mobile', packageName: 'com.tencent.ig', bundleId: 'com.tencent.ig', icon: '🎮', category: 'Gaming', isSystemApp: false },
    { id: '15', name: 'Free Fire', packageName: 'com.dts.freefireth', bundleId: 'com.dts.freefireth', icon: '🔥', category: 'Gaming', isSystemApp: false },
    { id: '16', name: 'Call of Duty', packageName: 'com.activision.callofduty.shooter', bundleId: 'com.activision.callofduty.shooter', icon: '🎯', category: 'Gaming', isSystemApp: false },
    { id: '17', name: 'Clash of Clans', packageName: 'com.supercell.clashofclans', bundleId: 'com.supercell.magic', icon: '⚔️', category: 'Gaming', isSystemApp: false },
    { id: '18', name: 'Candy Crush', packageName: 'com.king.candycrushsaga', bundleId: 'com.midasplayer.apps.candycrushsaga', icon: '🍬', category: 'Gaming', isSystemApp: false },
    { id: '19', name: 'Among Us', packageName: 'com.innersloth.spacemafia', bundleId: 'com.innersloth.amongus', icon: '🚀', category: 'Gaming', isSystemApp: false },
    { id: '20', name: 'Clash Royale', packageName: 'com.supercell.clashroyale', bundleId: 'com.supercell.clashroyale', icon: '👑', category: 'Gaming', isSystemApp: false },
    
    // Shopping
    { id: '21', name: 'Amazon', packageName: 'com.amazon.mShop.android.shopping', bundleId: 'com.amazon.Amazon', icon: '🛒', category: 'Shopping', isSystemApp: false },
    { id: '22', name: 'Flipkart', packageName: 'com.flipkart.android', bundleId: 'com.flipkart.app', icon: '🛍️', category: 'Shopping', isSystemApp: false },
    { id: '23', name: 'Myntra', packageName: 'com.myntra.android', bundleId: 'com.myntra.Myntra', icon: '👗', category: 'Shopping', isSystemApp: false },
    
    // Music
    { id: '24', name: 'Spotify', packageName: 'com.spotify.music', bundleId: 'com.spotify.client', icon: '🎵', category: 'Music', isSystemApp: false },
    { id: '25', name: 'YouTube Music', packageName: 'com.google.android.apps.youtube.music', bundleId: 'com.google.ios.youtubemusic', icon: '🎶', category: 'Music', isSystemApp: false },
    { id: '26', name: 'Gaana', packageName: 'com.gaana', bundleId: 'com.gaana.app', icon: '🎧', category: 'Music', isSystemApp: false },
    
    // Dating
    { id: '27', name: 'Tinder', packageName: 'com.tinder', bundleId: 'com.cardify.tinder', icon: '❤️', category: 'Dating', isSystemApp: false },
    { id: '28', name: 'Bumble', packageName: 'com.bumble.app', bundleId: 'com.bumble.app', icon: '💛', category: 'Dating', isSystemApp: false },
    
    // News
    { id: '29', name: 'Inshorts', packageName: 'com.nis.app', bundleId: 'com.nis.app', icon: '📰', category: 'News', isSystemApp: false },
    { id: '30', name: 'Dailyhunt', packageName: 'com.eterno', bundleId: 'com.eterno.dailyhunt', icon: '📱', category: 'News', isSystemApp: false },
  ];
}

/**
 * Categorize apps by distraction level
 */
export function categorizeApps(apps: InstalledApp[]): {
  highDistraction: InstalledApp[];
  mediumDistraction: InstalledApp[];
  lowDistraction: InstalledApp[];
  other: InstalledApp[];
} {
  const highDistraction = apps.filter(app => 
    ['Social Media', 'Gaming', 'Dating', 'Video', 'Entertainment'].includes(app.category)
  );
  
  const mediumDistraction = apps.filter(app => 
    ['Messaging', 'Shopping'].includes(app.category)
  );
  
  const lowDistraction = apps.filter(app => 
    ['Music', 'News'].includes(app.category)
  );
  
  const other = apps.filter(app => 
    !['Social Media', 'Gaming', 'Dating', 'Video', 'Entertainment', 'Messaging', 'Shopping', 'Music', 'News'].includes(app.category)
  );

  return {
    highDistraction,
    mediumDistraction,
    lowDistraction,
    other,
  };
}
