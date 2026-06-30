/**
 * Installed Apps Filter Service
 * Fetches and filters installed apps from the device for the Shield page.
 * Shows only apps that are actually installed on the student's phone.
 */

import { Platform } from 'react-native';
import { getRecommendedBlockingApps, InstalledApp } from './installedAppsService';
import { RecommendedApp } from '../data/recommendedApps';

export interface InstalledAppInfo {
  packageName: string;
  name: string;
  icon: string;
  category: string;
}

class InstalledAppsFilter {
  private installedApps: InstalledApp[] = [];
  private isLoaded: boolean = false;

  /**
   * Load installed apps from the device via native module
   */
  async loadInstalledApps(): Promise<void> {
    if (Platform.OS !== 'android') {
      this.installedApps = [];
      this.isLoaded = true;
      return;
    }

    try {
      const apps = await getRecommendedBlockingApps();
      this.installedApps = apps;
      this.isLoaded = true;
      console.log(`[InstalledAppsFilter] Loaded ${apps.length} installed distracting apps from device`);
    } catch (error) {
      console.warn('[InstalledAppsFilter] No installed distracting apps found:', error);
      this.installedApps = [];
      this.isLoaded = true;
    }
  }

  /**
   * Check if an app is installed
   */
  isAppInstalled(packageName: string): boolean {
    return this.installedApps.some(app => app.packageName === packageName);
  }

  /**
   * Get all installed apps (as RecommendedApp-compatible objects for UI)
   */
  getInstalledRecommendedApps(): RecommendedApp[] {
    if (!this.isLoaded) {
      console.warn('[InstalledAppsFilter] Apps not loaded yet, returning empty');
      return [];
    }

    return this.installedApps.map(app => ({
      packageName: app.packageName,
      name: app.name,
      icon: app.icon || '📱',
      category: (app.category as RecommendedApp['category']) || 'Other',
      description: app.category,
    }));
  }

  /**
   * Get installed apps by category
   */
  getInstalledAppsByCategory(category: string): RecommendedApp[] {
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
      'Short Video': 0,
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
    this.installedApps = [];
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
