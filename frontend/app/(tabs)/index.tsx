// Route: "/" → Home
import { DailyGoalCard } from '@/src/components/home/DailyGoalCard';
import { PetCard } from '@/src/components/home/PetCard';
import { StatsGrid } from '@/src/components/home/StatsGrid';
import { StreakCard } from '@/src/components/home/StreakCard';
import { COLORS } from '@/src/constants/colors';
import { MOCK_GOALS } from '@/src/constants/mockData';
import { useAuthStore, useHomeStore } from '@/src/store';
import { router } from 'expo-router';
import { BarChart3, ChevronRight, Zap } from 'lucide-react-native';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  // Get user from auth store
  const { user } = useAuthStore();
  
  // Get home data from home store
  const { 
    userStats, 
    petStatus, 
    dailyChallenges, 
    streakInfo,
    loading,
    loadHomeData 
  } = useHomeStore();

  // Load home data when user is available
  useEffect(() => {
    if (user) {
      console.log('Loading home data for user:', user.userId);
      loadHomeData(user.userId);
    }
  }, [user]);

  // Show loading indicator
  if (loading && !userStats) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.textSecondary, marginTop: 12 }}>
          Loading your data...
        </Text>
      </View>
    );
  }
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            Sankalp <Text style={styles.accent}>OS</Text>
          </Text>
          <Text style={styles.headerSub}>Focus Protocol Active</Text>
        </View>
      </View>

      {/* ── Stats Grid: Coins, Level, Achievement ── */}
      <StatsGrid
        coins={userStats?.currentFocusPoints || 100}
        level={userStats?.currentLevel || 1}
        levelProgress={userStats?.levelProgress || 0}
        achievementLevel={userStats?.achievementLevel || 'Novice I'}
        achievementName={userStats?.achievementName || 'Beginner'}
      />

      {/* ── Cyber Pet ── */}
      <PetCard 
        mood={petStatus?.mood || 'happy'} 
        loyalty={petStatus?.loyalty || 50} 
        health={petStatus?.health || 100} 
      />

      {/* ── Streak ── */}
      <StreakCard 
        streak={streakInfo?.currentStreak || 0} 
        bestStreak={streakInfo?.bestStreak || 0} 
        todayDone={streakInfo?.todayDone || false} 
      />

      {/* ── Daily Directives ── */}
      <DailyGoalCard 
        goals={dailyChallenges.length > 0 
          ? dailyChallenges.map(challenge => ({
              id: challenge.id,
              title: challenge.title,
              description: challenge.description,
              reward: `+${challenge.rewardFP} FP`,
              progress: challenge.progress,
              total: challenge.total,
              unit: challenge.unit,
              completed: challenge.completed,
            }))
          : MOCK_GOALS
        } 
      />

      {/* ── Study History Banner ── */}
      <Pressable
        style={styles.historyBanner}
        onPress={() => router.push('/study-history' as any)}
      >
        <View style={styles.bannerLeft}>
          <View style={[styles.bannerIcon, styles.historyIcon]}>
            <BarChart3 size={20} color="#8b5cf6" />
          </View>
          <View>
            <Text style={styles.bannerTitle}>Study History</Text>
            <Text style={styles.bannerSub}>View your progress & stats</Text>
          </View>
        </View>
        <ChevronRight size={20} color={COLORS.border} />
      </Pressable>

      {/* ── Start Focus Banner ── */}
      <Pressable
        style={styles.focusBanner}
        onPress={() => router.push('/focus' as any)}
      >
        <View style={styles.bannerLeft}>
          <View style={styles.bannerIcon}>
            <Zap size={20} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.bannerTitle}>Initialize Session</Text>
            <Text style={styles.bannerSub}>Enter isolated focus mode</Text>
          </View>
        </View>
        <ChevronRight size={20} color={COLORS.border} />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  container: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  accent: { color: COLORS.primary },
  headerSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  focusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 4,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(20,184,166,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  bannerSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  historyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 4,
  },
  historyIcon: {
    backgroundColor: 'rgba(139,92,246,0.12)',
  },
});
