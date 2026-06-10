// Route: "/profile" → Profile
import { ProfileMenu } from '@/src/components/profile/ProfileMenu';
import { COLORS } from '@/src/constants/colors';
import { profileService } from '@/src/services/profileService';
import { useAuthStore } from '@/src/store';
import { router } from 'expo-router';
import { Heart, LogOut, Settings, Target, Trophy } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
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
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/auth/login' as any);
    } catch (error) {
      console.error('Error signing out:', error);
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
        <View style={styles.avatarWrap}>
          <Image
            source={{ uri: profile.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user?.userId }}
            style={styles.avatar}
          />
        </View>
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

      {/* ── Stats Row ── */}
      <View style={styles.statsRow}>
        <StatCard label="Focus Points" value={`${profile.focusPoints} FP`} valueColor="#facc15" />
        <StatCard label="Sessions" value={`${profile.totalSessions}`} valueColor={COLORS.primary} />
        <StatCard label="Streak" value={`${profile.currentStreak} days`} valueColor={COLORS.primary} />
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
          },
          {
            id: 'pet',
            icon: <Heart size={18} color="#f472b6" />,
            title: 'Virtual Pet History',
            subtitle: 'View entity evolution',
          },
          {
            id: 'achievements',
            icon: <Trophy size={18} color="#facc15" />,
            title: 'Achievements',
            subtitle: `${unlockedAchievements.length} of ${achievements.length} unlocked`,
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

function StatCard({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, valueColor ? { color: valueColor } : null]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
  avatarWrap: {
    width: 60, height: 60,
    borderRadius: 30,
    borderWidth: 2, borderColor: COLORS.primary,
    overflow: 'hidden',
    boxShadow: `0 0 10px ${COLORS.primary}4D`, // 0.3 opacity
    elevation: 5,
  },
  avatar: { width: '100%', height: '100%' },
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

  // Stats
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
    gap: 4,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  statValue: { fontSize: 15, fontWeight: '700', color: COLORS.text, textAlign: 'center' },

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
