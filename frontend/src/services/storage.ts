import AsyncStorage from "@react-native-async-storage/async-storage";

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  AUTH_USER: 'auth_user',
  USER_COINS: 'user_coins',
  USER_LEVEL: 'user_level',
  USER_PROFILE: 'user_profile',
  STREAK: 'streak',
  BEST_STREAK: 'best_streak',
  LAST_SESSION_DATE: 'last_session_date',
  TOTAL_SESSIONS: 'total_sessions',
  BLOCKED_APPS: 'blocked_apps',
  ACHIEVEMENTS: 'achievements',
  PET_STATE: 'pet_state',
  FOCUS_HISTORY: 'focus_history',
  SETTINGS: 'settings',
  CUSTOM_SUBJECTS: 'custom_subjects',
  SUBJECT_STUDY_DATA: 'subject_study_data',
  SESSION_DURATION: 'session_duration',
} as const;

export const storage = {
  async getRaw(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`Error reading ${key}:`, error);
      return null;
    }
  },

  async setRaw(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error writing ${key}:`, error);
      throw error;
    }
  },

  async removeRaw(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      throw error;
    }
  },

  /**
   * Save data to AsyncStorage
   */
  async save<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      throw error;
    }
  },

  /**
   * Load data from AsyncStorage
   */
  async load<T>(key: string): Promise<T | null> {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error loading ${key}:`, error);
      return null;
    }
  },

  /**
   * Remove data from AsyncStorage
   */
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      throw error;
    }
  },

  /**
   * Clear all app data
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  },

  /**
   * Get all keys
   */
  async getAllKeys(): Promise<readonly string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  },
};

// Legacy exports for backward compatibility
export const saveData = storage.save;
export const getData = storage.load;