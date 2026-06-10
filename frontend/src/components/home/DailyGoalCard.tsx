import { CheckCircle } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants/colors';

export interface DailyGoal {
  id: string;
  title: string;
  description: string;
  reward: string;
  progress: number;
  total: number;
  unit: string;
  completed?: boolean;
}

interface DailyGoalCardProps {
  goals: DailyGoal[];
  completedCount?: number;
}

export function DailyGoalCard({ goals, completedCount }: DailyGoalCardProps) {
  const done = completedCount ?? goals.filter((g) => g.completed).length;

  return (
    <View style={styles.section}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Daily Directives</Text>
        <Text style={styles.meta}>
          {done} / {goals.length} Completed
        </Text>
      </View>

      {/* Goal rows */}
      {goals.map((goal) => (
        <GoalRow key={goal.id} goal={goal} />
      ))}
    </View>
  );
}

function GoalRow({ goal }: { goal: DailyGoal }) {
  const percent = Math.min(100, Math.round((goal.progress / goal.total) * 100));

  return (
    <View style={[styles.row, goal.completed && styles.rowDone]}>
      {/* Top */}
      <View style={styles.rowTop}>
        <View style={styles.rowMeta}>
          <Text style={[styles.rowTitle, goal.completed && styles.rowTitleDone]}>
            {goal.title}
          </Text>
          <Text style={styles.rowDesc}>{goal.description}</Text>
        </View>
        <View style={styles.rewardBadge}>
          <Text style={styles.rewardText}>{goal.reward}</Text>
        </View>
      </View>

      {/* Progress or done */}
      {!goal.completed ? (
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${percent}%` as any }]} />
          </View>
          <Text style={styles.progressLabel}>
            {goal.progress}/{goal.total}{goal.unit}
          </Text>
        </View>
      ) : (
        <View style={styles.doneRow}>
          <CheckCircle size={12} color={COLORS.primary} />
          <Text style={styles.doneText}>Directive Achieved</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  meta: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '500',
  },

  // Row
  row: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  rowDone: {
    backgroundColor: 'rgba(19,78,74,0.2)',
    borderColor: 'rgba(20,184,166,0.3)',
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  rowMeta: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  rowTitleDone: {
    color: COLORS.primary,
  },
  rowDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  rewardBadge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rewardText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#facc15',
  },

  // Progress
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
    width: 44,
    textAlign: 'right',
  },

  // Done
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  doneText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.primary,
  },
});
