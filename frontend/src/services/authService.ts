// Authentication Service with Backend API Integration
import { apiCall } from '../config/api';
import { storage, STORAGE_KEYS } from './storage';

export interface AuthUser {
  userId: string;
  username: string;
  email: string;
  avatar?: string;
  token: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  userId: string;
  username: string;
  email: string;
  avatar?: string;
  message?: string;
}

export interface UserProfile {
  userId: string;
  username: string;
  email: string;
  avatar: string;
  exam: string;
  examName: string;
  subjects: string[];
  joinedAt: Date;
  lastActive: Date;
  emailVerified: boolean;
}

class AuthService {
  async signUp(email: string, password: string, username: string): Promise<AuthResponse> {
    try {
      const response = await apiCall<AuthResponse>('/auth/signup', 'POST', {
        email,
        password,
        username,
      });

      if (response.token) {
        await this.persistSession({
          userId: response.userId,
          username: response.username,
          email: response.email,
          avatar: response.avatar,
          token: response.token,
        });
      }

      return response;
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw this.handleAuthError(error);
    }
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await apiCall<AuthResponse>('/auth/signin', 'POST', {
        email,
        password,
      });

      if (response.token) {
        await this.persistSession({
          userId: response.userId,
          username: response.username,
          email: response.email,
          avatar: response.avatar,
          token: response.token,
        });
      }

      return response;
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw this.handleAuthError(error);
    }
  }

  async signOut(): Promise<void> {
    try {
      await apiCall('/auth/signout', 'POST');
    } catch (error: any) {
      console.error('Sign out error:', error);
    } finally {
      await this.clearSession();
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await apiCall('/auth/reset-password', 'POST', { email });
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw this.handleAuthError(error);
    }
  }

  getCurrentUser(): AuthUser | null {
    return null;
  }

  async getToken(): Promise<string | null> {
    return storage.getRaw(STORAGE_KEYS.AUTH_TOKEN);
  }

  async persistSession(user: AuthUser): Promise<void> {
    await storage.setRaw(STORAGE_KEYS.AUTH_TOKEN, user.token);
    await storage.save(STORAGE_KEYS.AUTH_USER, {
      userId: user.userId,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
    });
  }

  async restoreSession(): Promise<AuthUser | null> {
    const token = await storage.getRaw(STORAGE_KEYS.AUTH_TOKEN);
    const savedUser = await storage.load<Omit<AuthUser, 'token'>>(STORAGE_KEYS.AUTH_USER);

    if (!token || !savedUser?.userId) {
      return null;
    }

    return { ...savedUser, token };
  }

  async clearSession(): Promise<void> {
    await storage.removeRaw(STORAGE_KEYS.AUTH_TOKEN);
    await storage.remove(STORAGE_KEYS.AUTH_USER);
  }

  async getUserProfile(_userId: string): Promise<UserProfile | null> {
    try {
      const response = await apiCall<any>('/profile', 'GET');
      return {
        userId: response.userId,
        username: response.username,
        email: response.email,
        avatar: response.avatar || '',
        exam: response.exam || '',
        examName: response.examName || '',
        subjects: response.subjects || [],
        joinedAt: new Date(response.joinedAt),
        lastActive: new Date(response.lastActive),
        emailVerified: response.emailVerified || false,
      };
    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  }

  async updateUserProfile(
    _userId: string,
    updates: Partial<UserProfile>
  ): Promise<void> {
    try {
      await apiCall('/profile', 'PUT', updates);
    } catch (error) {
      console.error('Update user profile error:', error);
      throw error;
    }
  }

  private handleAuthError(error: any): Error {
    let message = 'An error occurred. Please try again.';
    if (error.message) {
      message = error.message;
    }
    return new Error(message);
  }
}

export const authService = new AuthService();
