import { ArrowRight, Check, CheckCircle, Plus, Target, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '@/src/theme';
import type { ThemeColors } from '@/src/theme';

export interface DailyGoal {
  id: string;
  title: string;
  description: string;
  type?: 'session' | 'time' | 'streak' | 'blocking' | 'deep-work' | 'custom';
  reward: string;
  progress: number;
  total: number;
  unit: string;
  completed?: boolean;
}

interface DailyGoalCardProps {
  goals: DailyGoal[];
  completedCount?: number;
  completingGoalId?: string | null;
  creatingGoal?: boolean;
  onCompleteGoal?: (goalId: string) => void | Promise<void>;
  onCreateGoal?: (title: string, description?: string) => void | Promise<void>;
  onGoalPress?: (goal: DailyGoal) => void;
}

export function DailyGoalCard({
  goals,
  completedCount,
  completingGoalId,
  creatingGoal = false,
  onCompleteGoal,
  onCreateGoal,
  onGoalPress,
}: DailyGoalCardProps) {
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const done = completedCount ?? goals.filter((g) => g.completed).length;
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');

  const submitCustomGoal = async () => {
    const title = customTitle.trim();

    if (!title) {
      return;
    }

    try {
      await onCreateGoal?.(title, customDescription.trim() || undefined);
      setCustomTitle('');
      setCustomDescription('');
      setShowCustomForm(false);
    } catch {
      // The parent screen owns error messaging.
    }
  };

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
        <GoalRow
          key={goal.id}
          goal={goal}
          isLoading={completingGoalId === goal.id}
          onComplete={onCompleteGoal}
          onGoalPress={onGoalPress}
        />
      ))}

      {showCustomForm ? (
        <View style={styles.customForm}>
          <View style={styles.customHeader}>
            <View style={styles.customHeading}>
              <View style={styles.customIconWrap}>
                <Target size={16} color={COLORS.primary} />
              </View>
              <View style={styles.customTitleWrap}>
                <Text style={styles.customTitle}>Custom Target</Text>
                <Text style={styles.customSubtitle}>One clear outcome for today</Text>
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.iconButtonPressed,
              ]}
              onPress={() => setShowCustomForm(false)}
              disabled={creatingGoal}
              hitSlop={8}
            >
              <X size={16} color={COLORS.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.fieldHeader}>
              <Text style={styles.fieldLabel}>Title</Text>
              <Text style={styles.fieldCount}>{customTitle.length}/80</Text>
            </View>
            <TextInput
              value={customTitle}
              onChangeText={setCustomTitle}
              placeholder="Read one chapter"
              placeholderTextColor={COLORS.textSecondary}
              style={[styles.input, customTitle.trim() && styles.inputActive]}
              maxLength={80}
              editable={!creatingGoal}
              returnKeyType="next"
            />
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.fieldHeader}>
              <Text style={styles.fieldLabel}>Detail</Text>
              <Text style={styles.fieldCount}>{customDescription.length}/160</Text>
            </View>
            <TextInput
              value={customDescription}
              onChangeText={setCustomDescription}
              placeholder="Topic, pages, or checkpoint"
              placeholderTextColor={COLORS.textSecondary}
              style={[styles.input, styles.textArea]}
              maxLength={160}
              editable={!creatingGoal}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={styles.formActions}>
            <Pressable
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.secondaryButtonPressed,
              ]}
              onPress={() => setShowCustomForm(false)}
              disabled={creatingGoal}
            >
              <X size={15} color={COLORS.textSecondary} />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.saveButton,
                (!customTitle.trim() || creatingGoal) && styles.saveButtonDisabled,
                pressed && customTitle.trim() && !creatingGoal && styles.saveButtonPressed,
              ]}
              onPress={submitCustomGoal}
              disabled={!customTitle.trim() || creatingGoal}
            >
              <Check size={15} color={COLORS.background} />
              <Text style={styles.saveButtonText}>
                {creatingGoal ? 'Adding...' : 'Add Target'}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            !onCreateGoal && styles.addButtonDisabled,
            pressed && !!onCreateGoal && styles.addButtonPressed,
          ]}
          onPress={() => setShowCustomForm(true)}
          disabled={!onCreateGoal}
        >
          <View style={styles.addIconWrap}>
            <Plus size={16} color={COLORS.primary} />
          </View>
          <Text style={styles.addButtonText}>Add Custom Target</Text>
        </Pressable>
      )}
    </View>
  );
}

function GoalRow({
  goal,
  isLoading,
  onComplete,
  onGoalPress,
}: {
  goal: DailyGoal;
  isLoading: boolean;
  onComplete?: (goalId: string) => void | Promise<void>;
  onGoalPress?: (goal: DailyGoal) => void;
}) {
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const percent = goal.total > 0
    ? Math.min(100, Math.round((goal.progress / goal.total) * 100))
    : 0;
  const canStart = !goal.completed && !isLoading && !!onGoalPress;
  const canComplete = !goal.completed && !isLoading && !!onComplete;
  const canAct = canStart || canComplete;
  const showActionPill = !goal.completed && (!!onGoalPress || !!onComplete);
  const actionLabel = goal.type === 'blocking' || goal.type === 'streak' ? 'Done' : 'Start';
  const actionIcon = actionLabel === 'Done'
    ? <Check size={12} color={COLORS.background} />
    : <ArrowRight size={12} color={COLORS.background} />;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        goal.completed && styles.rowDone,
        canAct && pressed && styles.rowPressed,
      ]}
      onPress={() => {
        if (canStart) {
          onGoalPress?.(goal);
          return;
        }

        if (canComplete) {
          onComplete?.(goal.id);
        }
      }}
      disabled={!canStart && !canComplete}
    >
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
        <View style={styles.rowBottom}>
          <View style={styles.progressGroup}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${percent}%` as any }]} />
            </View>
            <Text style={styles.progressLabel}>
              {isLoading ? '...' : `${goal.progress}/${goal.total}${goal.unit}`}
            </Text>
          </View>
          {showActionPill && (
            <View style={[styles.actionPill, isLoading && styles.actionPillLoading]}>
              {!isLoading && actionIcon}
              <Text style={styles.actionPillText}>{isLoading ? '...' : actionLabel}</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.doneRow}>
          <CheckCircle size={12} color={COLORS.primary} />
          <Text style={styles.doneText}>Directive Achieved</Text>
        </View>
      )}
    </Pressable>
  );
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
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
  rowPressed: {
    opacity: 0.72,
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
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  progressGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
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
  actionPill: {
    minHeight: 28,
    minWidth: 66,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 10,
  },
  actionPillLoading: {
    opacity: 0.75,
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.background,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.35)',
    borderRadius: 12,
    backgroundColor: 'rgba(20,184,166,0.08)',
    paddingHorizontal: 12,
  },
  addButtonPressed: {
    opacity: 0.72,
  },
  addButtonDisabled: {
    opacity: 0.45,
  },
  addIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,184,166,0.12)',
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  customForm: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.3)',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customHeading: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  customIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,184,166,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.24)',
  },
  customTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  customTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  customSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  iconButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconButtonPressed: {
    opacity: 0.72,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
  },
  fieldCount: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  input: {
    minHeight: 42,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    color: COLORS.text,
    backgroundColor: COLORS.background,
    fontSize: 13,
  },
  inputActive: {
    borderColor: 'rgba(20,184,166,0.6)',
  },
  textArea: {
    minHeight: 76,
    paddingTop: 11,
    paddingBottom: 11,
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    flexDirection: 'row',
    gap: 6,
  },
  secondaryButtonPressed: {
    opacity: 0.72,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  saveButton: {
    flex: 1.2,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    gap: 6,
  },
  saveButtonDisabled: {
    opacity: 0.45,
  },
  saveButtonPressed: {
    opacity: 0.78,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.background,
  },
});
