/**
 * PremiumModal - Shield upgrade flow with plan comparison and checkout.
 */

import { RADIUS, SPACING } from '@/src/constants/spacing';
import {
  BillingInterval,
  SubscriptionPlan,
  SubscriptionPlanId,
  SubscriptionState,
  subscriptionService,
} from '@/src/services/subscriptionService';
import { useShieldStore } from '@/src/store/newShieldStore';
import { useTheme } from '@/src/theme';
import type { ThemeColors } from '@/src/theme';
import { AlertTriangle, Check, CheckCircle, CreditCard, Shield, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type UpgradePlanId = Exclude<SubscriptionPlanId, 'free'>;
type PremiumModalReason = 'limit' | 'suggestion';
type CheckoutState = 'idle' | 'processing' | 'success' | 'error';

interface PremiumModalProps {
  visible: boolean;
  currentPlan: SubscriptionState;
  currentAppLimit: number | null;
  freeAppLimit: number;
  blockedAppsCount: number;
  selectedAppsCount: number;
  reason?: PremiumModalReason;
  onClose: () => void;
}

const PLANS = subscriptionService.getPlans();
const PAID_PLANS = PLANS.filter(
  (plan): plan is SubscriptionPlan & { id: UpgradePlanId } => plan.id !== 'free'
);

export function PremiumModal({
  visible,
  currentPlan,
  currentAppLimit,
  freeAppLimit,
  blockedAppsCount,
  selectedAppsCount,
  reason = 'limit',
  onClose,
}: PremiumModalProps) {
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const setSubscription = useShieldStore((state) => state.setSubscription);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [selectedPlanId, setSelectedPlanId] = useState<UpgradePlanId>('basic');
  const [checkoutState, setCheckoutState] = useState<CheckoutState>('idle');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const requestedAppsCount = blockedAppsCount + selectedAppsCount;
  const currentPlanDetails = subscriptionService.getPlan(currentPlan.plan);
  const selectedPlan = PAID_PLANS.find((plan) => plan.id === selectedPlanId) ?? PAID_PLANS[0];
  const isProcessing = checkoutState === 'processing';
  const isSuccess = checkoutState === 'success';
  const isCurrentPaidPlan =
    currentPlan.status === 'active' && currentPlan.plan !== 'free' && currentPlan.plan === selectedPlan.id;

  const recommendedPlanId = useMemo<UpgradePlanId>(() => {
    if (currentPlan.plan === 'basic') return 'pro';
    if (requestedAppsCount > 4) return 'pro';
    return 'basic';
  }, [currentPlan.plan, requestedAppsCount]);

  const handleModalShow = () => {
    setBillingInterval('monthly');
    setSelectedPlanId(recommendedPlanId);
    setCheckoutState('idle');
    setCheckoutError(null);
  };

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const handleClose = () => {
    if (isProcessing) return;
    onClose();
  };

  const handleCheckout = async () => {
    if (!selectedPlan || isCurrentPaidPlan || isProcessing) return;

    setCheckoutState('processing');
    setCheckoutError(null);

    try {
      const subscription = await subscriptionService.startUpgrade({
        plan: selectedPlan.id,
        interval: billingInterval,
      });

      await setSubscription(subscription);
      setCheckoutState('success');

      closeTimerRef.current = setTimeout(() => {
        onClose();
      }, 900);
    } catch (error: any) {
      setCheckoutState('error');
      setCheckoutError(error?.message || 'Upgrade failed. Please try again.');
    }
  };

  const title =
    reason === 'suggestion' ? 'Upgrade Shield Protection' : 'Shield Limit Reached';
  const description =
    reason === 'suggestion'
      ? 'Use a higher Shield plan when your focus setup needs more blocked apps.'
      : 'Your current Shield plan cannot block more apps in this session.';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      onShow={handleModalShow}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <View style={styles.modal} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              {isSuccess ? (
                <CheckCircle size={28} color={COLORS.success} />
              ) : (
                <Shield size={28} color={COLORS.primary} />
              )}
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>{isSuccess ? 'Premium Unlocked' : title}</Text>
              <Text style={styles.description}>
                {isSuccess ? 'Your new Shield limit is active now.' : description}
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.closeButton, pressed && styles.buttonPressed]}
              onPress={handleClose}
              disabled={isProcessing}
            >
              <X size={18} color={COLORS.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {isSuccess ? (
              <View style={styles.successPanel}>
                <CheckCircle size={44} color={COLORS.success} />
                <Text style={styles.successTitle}>
                  {subscriptionService.getPlan(selectedPlan.id).name} is ready
                </Text>
                <Text style={styles.successText}>
                  Shield can now block {formatAppLimit(selectedPlan.appLimit).toLowerCase()}.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.usagePanel}>
                  <View style={styles.usageRow}>
                    <Text style={styles.usageLabel}>Current plan</Text>
                    <Text style={styles.usageValue}>{currentPlanDetails.name}</Text>
                  </View>
                  <View style={styles.usageRow}>
                    <Text style={styles.usageLabel}>Apps in this action</Text>
                    <Text style={styles.usageValue}>
                      {requestedAppsCount || blockedAppsCount || freeAppLimit}
                    </Text>
                  </View>
                  <View style={styles.usageRow}>
                    <Text style={styles.usageLabel}>Current limit</Text>
                    <Text style={styles.usageValue}>{formatAppLimit(currentAppLimit)}</Text>
                  </View>
                </View>

                <View style={styles.billingToggle}>
                  {(['monthly', 'yearly'] as BillingInterval[]).map((interval) => {
                    const active = billingInterval === interval;
                    return (
                      <Pressable
                        key={interval}
                        style={({ pressed }) => [
                          styles.billingOption,
                          active && styles.billingOptionActive,
                          pressed && styles.buttonPressed,
                        ]}
                        onPress={() => setBillingInterval(interval)}
                      >
                        <Text
                          style={[
                            styles.billingText,
                            active && styles.billingTextActive,
                          ]}
                        >
                          {interval === 'monthly' ? 'Monthly' : 'Yearly'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.planList}>
                  {PLANS.map((plan) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      interval={billingInterval}
                      selected={plan.id === selectedPlan.id}
                      current={currentPlan.status === 'active' && currentPlan.plan === plan.id}
                      recommended={plan.id === recommendedPlanId}
                      disabled={plan.id === 'free'}
                      onSelect={() => {
                        if (plan.id !== 'free') {
                          setSelectedPlanId(plan.id);
                        }
                      }}
                    />
                  ))}
                </View>
              </>
            )}
          </ScrollView>

          {checkoutError && !isSuccess && (
            <View style={styles.errorBox}>
              <AlertTriangle size={16} color={COLORS.error} />
              <Text style={styles.errorText}>{checkoutError}</Text>
            </View>
          )}

          {!isSuccess && (
            <Pressable
              style={({ pressed }) => [
                styles.checkoutButton,
                (isProcessing || isCurrentPaidPlan) && styles.checkoutButtonDisabled,
                pressed && !isProcessing && styles.buttonPressed,
              ]}
              onPress={handleCheckout}
              disabled={isProcessing || isCurrentPaidPlan}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <CreditCard size={18} color="#fff" />
              )}
              <Text style={styles.checkoutButtonText}>
                {isProcessing
                  ? 'Confirming upgrade...'
                  : isCurrentPaidPlan
                    ? 'Current plan active'
                    : `Upgrade to ${selectedPlan.name}`}
              </Text>
            </Pressable>
          )}
        </View>
      </Pressable>
    </Modal>
  );
}

interface PlanCardProps {
  plan: SubscriptionPlan;
  interval: BillingInterval;
  selected: boolean;
  current: boolean;
  recommended: boolean;
  disabled: boolean;
  onSelect: () => void;
}

function PlanCard({
  plan,
  interval,
  selected,
  current,
  recommended,
  disabled,
  onSelect,
}: PlanCardProps) {
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const price = interval === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.planCard,
        selected && styles.planCardSelected,
        current && styles.planCardCurrent,
        pressed && !disabled && styles.buttonPressed,
      ]}
      onPress={onSelect}
      disabled={disabled}
    >
      <View style={styles.planHeader}>
        <View style={styles.planTitleRow}>
          <Text style={styles.planName}>{plan.name}</Text>
          {current && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>Current</Text>
            </View>
          )}
          {!current && recommended && (
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedBadgeText}>Recommended</Text>
            </View>
          )}
        </View>
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected && <Check size={14} color="#fff" strokeWidth={3} />}
        </View>
      </View>

      <View style={styles.planMetaRow}>
        <Text style={styles.planPrice}>{price}</Text>
        <Text style={styles.planLimit}>{formatAppLimit(plan.appLimit)}</Text>
      </View>

      <View style={styles.featureList}>
        {plan.features.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <Check size={13} color={COLORS.primary} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

function formatAppLimit(limit: number | null): string {
  if (limit === null) return 'Unlimited apps';
  return `${limit} app${limit === 1 ? '' : 's'}`;
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },

  modal: {
    width: '100%',
    maxWidth: 390,
    maxHeight: '88%',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerText: {
    flex: 1,
    gap: 3,
  },

  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },

  description: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },

  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  body: {
    width: '100%',
  },

  bodyContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },

  usagePanel: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },

  usageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },

  usageLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  usageValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },

  billingToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 3,
  },

  billingOption: {
    flex: 1,
    minHeight: 34,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },

  billingOptionActive: {
    backgroundColor: COLORS.primary,
  },

  billingText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },

  billingTextActive: {
    color: '#fff',
  },

  planList: {
    gap: SPACING.sm,
  },

  planCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },

  planCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}08`,
  },

  planCardCurrent: {
    borderColor: `${COLORS.secondary}90`,
  },

  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },

  planTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },

  planName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },

  currentBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    backgroundColor: `${COLORS.secondary}20`,
  },

  currentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.secondary,
  },

  recommendedBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    backgroundColor: `${COLORS.primary}20`,
  },

  recommendedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },

  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  radioSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  planMetaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },

  planPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },

  planLimit: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },

  featureList: {
    gap: 6,
  },

  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },

  featureText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },

  successPanel: {
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: `${COLORS.success}10`,
    borderWidth: 1,
    borderColor: `${COLORS.success}40`,
    borderRadius: RADIUS.md,
    padding: SPACING.xl,
  },

  successTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },

  successText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.error,
    backgroundColor: `${COLORS.error}12`,
  },

  errorText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.error,
    lineHeight: 16,
  },

  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    minHeight: 48,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
  },

  checkoutButtonDisabled: {
    opacity: 0.55,
  },

  checkoutButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },

  buttonPressed: {
    opacity: 0.75,
  },
});
