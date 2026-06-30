// Route: "/profile" → Profile
import { ProfileMenu } from '@/src/components/profile/ProfileMenu';
import { authService } from '@/src/services/authService';
import { profileService } from '@/src/services/profileService';
import { useAuthStore } from '@/src/store';
import { useTheme } from '@/src/theme';
import type { ThemeColors } from '@/src/theme';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Camera, LogOut, Settings, Target, Trophy } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ProfileScreen() {
  const { user, signOut, setUser } = useAuthStore();
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const [profile, setProfile] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const [profileData, achievementsData] = await Promise.all([
        profileService.getUserProfile(user.userId),
        profileService.getUserAchievements(user.userId),
      ]);
      setProfile(profileData);
      setAchievements(achievementsData);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadProfile();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadProfile]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/auth/login' as any);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleChangePhoto = async () => {
    if (uploadingPhoto) return;

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission needed',
          'Please allow photo library access to upload a profile picture.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const newAvatar = asset.base64
        ? `data:image/jpeg;base64,${asset.base64}`
        : asset.uri;

      setUploadingPhoto(true);

      // Update UI immediately.
      setProfile((prev: any) => (prev ? { ...prev, avatar: newAvatar } : prev));

      // Persist locally so the new photo survives app restarts.
      if (user) {
        const updatedUser = { ...user, avatar: newAvatar };
        setUser(updatedUser);
        await authService.persistSession(updatedUser);

        // Best-effort sync to the backend (won't block the UI if it fails).
        try {
          await profileService.updateUserProfile(user.userId, { avatar: newAvatar });
        } catch (syncError) {
          console.warn('Could not sync avatar to server:', syncError);
        }
      }
    } catch (error) {
      console.error('Error updating photo:', error);
      Alert.alert('Upload failed', 'Could not update your profile picture. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.textSecondary, marginTop: 12 }}>
          Loading profile...
        </Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: COLORS.text, fontSize: 16 }}>
          Profile not found
        </Text>
      </View>
    );
  }

  const unlockedAchievements = achievements.filter(a => a.unlocked);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Pressable
          style={styles.settingsBtn}
          onPress={() => router.push('/settings' as any)}
        >
          <Settings size={18} color={COLORS.textSecondary} />
        </Pressable>
      </View>

      {/* ── User Card ── */}
      <View style={styles.userCard}>
        <Pressable style={styles.avatarContainer} onPress={handleChangePhoto} disabled={uploadingPhoto}>
          <View style={styles.avatarWrap}>
            <Image
              source={{ uri: profile.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user?.userId }}
              style={styles.avatar}
            />
          </View>
          <View style={styles.cameraBadge}>
            {uploadingPhoto ? (
              <ActivityIndicator size="small" color={COLORS.background} />
            ) : (
              <Camera size={12} color={COLORS.background} />
            )}
          </View>
        </Pressable>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{profile.username}</Text>
          <Text style={styles.userRole}>Student</Text>
          <Text style={styles.userJoined}>
            Joined {new Date(profile.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </Text>
        </View>
        {/* Level badge */}
        <View style={styles.levelBadge}>
          <Text style={styles.levelNum}>{profile.level}</Text>
          <Text style={styles.levelLabel}>LVL</Text>
        </View>
      </View>

      {/* ── Achievements Section ── */}
      <View style={styles.achievementsSection}>
        <View style={styles.achievementsHeader}>
          <Trophy size={20} color={COLORS.primary} />
          <Text style={styles.achievementsTitle}>Achievements</Text>
          <Text style={styles.achievementsBadge}>
            {unlockedAchievements.length}/{achievements.length}
          </Text>
        </View>
        
        <View style={styles.achievementsGrid}>
          {achievements.slice(0, 6).map((achievement) => (
            <View
              key={achievement.id}
              style={[
                styles.achievementCard,
                !achievement.unlocked && styles.achievementLocked
              ]}
            >
              <Text style={styles.achievementIcon}>{achievement.icon}</Text>
              <Text style={styles.achievementTitle} numberOfLines={1}>
                {achievement.title}
              </Text>
              {achievement.unlocked ? (
                <Text style={styles.achievementUnlocked}>✓</Text>
              ) : (
                <Text style={styles.achievementProgress}>
                  {achievement.progress}%
                </Text>
              )}
            </View>
          ))}
        </View>
        
        <Pressable
          style={styles.viewAllBtn}
          onPress={() => router.push('/achievement-levels' as any)}
        >
          <Text style={styles.viewAllText}>View All Achievements</Text>
        </Pressable>
      </View>

      {/* ── Account Menu ── */}
      <ProfileMenu
        title="Account"
        items={[
          {
            id: 'goal',
            icon: <Target size={18} color={COLORS.primary} />,
            title: 'Exam Goal Setup',
            subtitle: 'Configure your target exam',
            onPress: () => router.push('/settings' as any),
          },
          {
            id: 'settings',
            icon: <Settings size={18} color={COLORS.primary} />,
            title: 'Settings',
            subtitle: 'Profile, preferences & more',
            onPress: () => router.push('/settings' as any),
          },
          {
            id: 'achievements',
            icon: <Trophy size={18} color="#facc15" />,
            title: 'Achievements',
            subtitle: `${unlockedAchievements.length} of ${achievements.length} unlocked`,
            onPress: () => router.push('/achievement-levels' as any),
          },
        ]}
      />

      {/* ── Danger Zone ── */}
      <ProfileMenu
        title="Session"
        items={[
          {
            id: 'logout',
            icon: <LogOut size={18} color={COLORS.danger} />,
            title: 'Log Out',
            subtitle: 'Disconnect session',
            isDestructive: true,
            onPress: handleSignOut,
          },
        ]}
      />
    </ScrollView>
  );
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  container: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 16,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text, letterSpacing: -0.5 },
  settingsBtn: {
    width: 40, height: 40,
    backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },

  // User card
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 20,
    padding: 18,
  },
  avatarContainer: {
    width: 60, height: 60,
    position: 'relative',
  },
  avatarWrap: {
    width: 60, height: 60,
    borderRadius: 30,
    borderWidth: 2, borderColor: COLORS.primary,
    overflow: 'hidden',
    boxShadow: `0 0 10px ${COLORS.primary}4D`, // 0.3 opacity
    elevation: 5,
  },
  avatar: { width: '100%', height: '100%' },
  cameraBadge: {
    position: 'absolute',
    bottom: -2, right: -2,
    width: 22, height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.surface,
  },
  userInfo: { flex: 1, gap: 2 },
  userName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  userRole: { fontSize: 12, color: COLORS.primary, fontWeight: '500' },
  userJoined: { fontSize: 11, color: COLORS.textSecondary },
  levelBadge: {
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  levelNum: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  levelLabel: { fontSize: 9, color: COLORS.textSecondary, fontWeight: '600', letterSpacing: 1 },

  // Achievements
  achievementsSection: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  achievementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  achievementsTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  achievementsBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    backgroundColor: COLORS.card,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  achievementCard: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  achievementLocked: {
    opacity: 0.5,
  },
  achievementIcon: {
    fontSize: 28,
  },
  achievementTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  achievementUnlocked: {
    fontSize: 16,
    color: '#10b981',
  },
  achievementProgress: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  viewAllBtn: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
