/**
 * Installed Apps Filter Service
 * Filters recommended apps to show only those installed on the device
 */

import { Platform } from 'react-native';
import { appBlockerNative } from './appBlockerNative';
import { RECOMMENDED_APPS, RecommendedApp } from '../data/recommendedApps';

export interface InstalledAppInfo {
  packageName: string;
  name: string;
}

class InstalledAppsFilter {
  private installedPackages: Set<string> = new Set();
  private isLoaded: boolean = false;

  /**
   * Load installed apps from the device
   */
  async loadInstalledApps(): Promise<void> {
    if (Platform.OS !== 'android') {
      // On iOS or other platforms, show all recommended apps
      this.installedPackages = new Set(RECOMMENDED_APPS.map(app => app.packageName));
      this.isLoaded = true;
      return;
    }

    try {
      const installedApps = await appBlockerNative.getInstalledApps();
      
      // Store package names in a Set for fast lookup
      this.installedPackages = new Set(
        installedApps.map(app => app.packageName)
      );
      
      this.isLoaded = true;
      console.log(`[InstalledAppsFilter] Loaded ${this.installedPackages.size} installed apps`);
    } catch (error) {
      console.error('[InstalledAppsFilter] Failed to load installed apps:', error);
      // Fallback: show all recommended apps
      this.installedPackages = new Set(RECOMMENDED_APPS.map(app => app.packageName));
      this.isLoaded = true;
    }
  }

  /**
   * Check if an app is installed
   */
  isAppInstalled(packageName: string): boolean {
    return this.installedPackages.has(packageName);
  }

  /**
   * Get only installed apps from recommended apps
   */
  getInstalledRecommendedApps(): RecommendedApp[] {
    if (!this.isLoaded) {
      console.warn('[InstalledAppsFilter] Apps not loaded yet, returning all recommended apps');
      return RECOMMENDED_APPS;
    }

    return RECOMMENDED_APPS.filter(app => this.isAppInstalled(app.packageName));
  }

  /**
   * Get installed apps by category
   */
  getInstalledAppsByCategory(category: RecommendedApp['category']): RecommendedApp[] {
    return this.getInstalledRecommendedApps().filter(app => app.category === category);
  }

  /**
   * Search within installed apps only
   */
  searchInstalledApps(query: string): RecommendedApp[] {
    const lowerQuery = query.toLowerCase();
    return this.getInstalledRecommendedApps().filter(
      app =>
        app.name.toLowerCase().includes(lowerQuery) ||
        app.description?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get count of installed apps by category
   */
  getInstalledCountByCategory(): Record<string, number> {
    const installedApps = this.getInstalledRecommendedApps();
    const counts: Record<string, number> = {
      'Social Media': 0,
      'Gaming': 0,
      'Entertainment': 0,
      'Other': 0,
    };

    installedApps.forEach(app => {
      counts[app.category] = (counts[app.category] || 0) + 1;
    });

    return counts;
  }

  /**
   * Get total count of installed recommended apps
   */
  getInstalledCount(): number {
    return this.getInstalledRecommendedApps().length;
  }

  /**
   * Refresh installed apps list
   */
  async refresh(): Promise<void> {
    this.isLoaded = false;
    await this.loadInstalledApps();
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isLoaded;
  }
}

export const installedAppsFilter = new InstalledAppsFilter();
