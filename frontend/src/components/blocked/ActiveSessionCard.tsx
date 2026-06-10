import { Clock, Shield, TrendingUp } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants/colors';
import { BlockingSession, REWARD_COINS } from '../../services/blockingService';

interface ActiveSessionCardProps {
  session: BlockingSession;
  appName: string;
  onSessionComplete?: (sessionId: string) => void;
}

export function ActiveSessionCard({ session, appName, onSessionComplete }: ActiveSessionCardProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [hasNotified, setHasNotified] = useState(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      try {
        // Ensure startTime is a valid Date object
        let startTime: Date;
        if (session.startTime instanceof Date) {
          startTime = session.startTime;
        } else if (typeof session.startTime === 'string') {
          startTime = new Date(session.startTime);
        } else {
          console.error('Invalid startTime:', session.startTime);
          startTime = new Date(); // Fallback to now
        }

        const startTimeMs = startTime.getTime();
        const endTime = startTimeMs + session.duration * 60 * 1000;
        const now = Date.now();
        const remaining = Math.max(0, endTime - now);
        const elapsed = now - startTimeMs;
        const totalDuration = session.duration * 60 * 1000;
        const progressPercent = Math.min(100, (elapsed / totalDuration) * 100);

        setTimeRemaining(remaining);
        setProgress(progressPercent);

        // Notify parent when session completes
        if (remaining === 0 && !hasNotified && onSessionComplete) {
          setHasNotified(true);
          onSessionComplete(session.id);
        }
      } catch (error) {
        console.error('Error calculating time remaining:', error);
        setTimeRemaining(0);
        setProgress(0);
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [session, hasNotified, onSessionComplete]);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isCompleted = timeRemaining === 0;

  return (
    <View style={[styles.card, isCompleted && styles.cardCompleted]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBox, isCompleted && styles.iconBoxCompleted]}>
            <Shield size={16} color={isCompleted ? COLORS.success : COLORS.primary} />
          </View>
          <View>
            <Text style={styles.appName}>{appName}</Text>
            <Text style={styles.status}>
              {isCompleted ? 'Session Completed! 🎉' : 'Blocking Active'}
            </Text>
          </View>
        </View>
        {!isCompleted && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{Math.round(progress)}%</Text>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Clock size={14} color={COLORS.textSecondary} />
          <Text style={styles.statLabel}>Time Left</Text>
          <Text style={[styles.statValue, isCompleted && styles.statValueSuccess]}>
            {isCompleted ? 'Done!' : formatTime(timeRemaining)}
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <TrendingUp size={14} color={COLORS.success} />
          <Text style={styles.statLabel}>Reward</Text>
          <Text style={[styles.statValue, styles.statValueSuccess]}>+{REWARD_COINS} FP</Text>
        </View>
      </View>

      {/* Completion Message */}
      {isCompleted && (
        <View style={styles.completionBanner}>
          <Text style={styles.completionText}>
            ✨ Great job! Complete your focus session to claim your reward.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.3)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  cardCompleted: {
    borderColor: 'rgba(34,197,94,0.4)',
    backgroundColor: 'rgba(34,197,94,0.05)',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(20,184,166,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxCompleted: {
    backgroundColor: 'rgba(34,197,94,0.15)',
  },
  appName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  status: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.danger,
  },
  liveText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#f87171',
    letterSpacing: 0.5,
  },

  // Progress
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBg: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.card,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    minWidth: 35,
    textAlign: 'right',
  },

  // Stats
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.card,
    padding: 10,
    borderRadius: 10,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    flex: 1,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  statValueSuccess: {
    color: COLORS.success,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },

  // Completion Banner
  completionBanner: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.2)',
    borderRadius: 10,
    padding: 10,
  },
  completionText: {
    fontSize: 11,
    color: COLORS.success,
    textAlign: 'center',
    lineHeight: 16,
  },
});
