import { apiCall } from '../config/api';
import { STORAGE_KEYS, storage } from './storage';

export type SubscriptionPlanId = 'free' | 'basic' | 'pro';
export type BillingInterval = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'expired' | 'canceled';

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  appLimit: number | null;
  monthlyPrice: string;
  yearlyPrice: string;
  badge?: string;
  features: string[];
}

export interface SubscriptionState {
  plan: SubscriptionPlanId;
  status: SubscriptionStatus;
  appLimit: number | null;
  expiresAt?: string | null;
  provider?: string | null;
  updatedAt: string;
}

export interface CheckoutRequest {
  plan: Exclude<SubscriptionPlanId, 'free'>;
  interval: BillingInterval;
}

export interface CheckoutSession {
  checkoutId: string;
  plan: Exclude<SubscriptionPlanId, 'free'>;
  interval: BillingInterval;
  amount: string;
  provider: string;
  status: 'ready';
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    appLimit: 2,
    monthlyPrice: 'Free',
    yearlyPrice: 'Free',
    features: ['Block 2 apps', 'Focus session timer', 'Banking apps stay safe'],
  },
  {
    id: 'basic',
    name: 'Basic',
    appLimit: 4,
    monthlyPrice: 'Rs 99/mo',
    yearlyPrice: 'Rs 799/yr',
    badge: 'Good start',
    features: ['Block 4 apps', 'Add apps mid-session', 'Priority Focus Protection'],
  },
  {
    id: 'pro',
    name: 'Pro',
    appLimit: null,
    monthlyPrice: 'Rs 199/mo',
    yearlyPrice: 'Rs 1,499/yr',
    badge: 'Best value',
    features: ['Unlimited app blocking', 'Best for exam prep', 'All premium upgrades'],
  },
];

export const DEFAULT_SUBSCRIPTION: SubscriptionState = {
  plan: 'free',
  status: 'active',
  appLimit: 2,
  expiresAt: null,
  provider: null,
  updatedAt: new Date(0).toISOString(),
};

const PLAN_LIMITS: Record<SubscriptionPlanId, number | null> = {
  free: 2,
  basic: 4,
  pro: null,
};

class SubscriptionService {
  getPlans(): SubscriptionPlan[] {
    return SUBSCRIPTION_PLANS;
  }

  getPlan(plan: SubscriptionPlanId): SubscriptionPlan {
    return SUBSCRIPTION_PLANS.find((item) => item.id === plan) ?? SUBSCRIPTION_PLANS[0];
  }

  getLimit(plan: SubscriptionPlanId): number | null {
    return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  }

  getEffectiveSubscription(subscription: SubscriptionState): SubscriptionState {
    if (this.isExpired(subscription)) {
      return {
        ...DEFAULT_SUBSCRIPTION,
        status: 'expired',
        expiresAt: subscription.expiresAt,
        provider: subscription.provider,
        updatedAt: new Date().toISOString(),
      };
    }

    return {
      ...subscription,
      appLimit: this.getLimit(subscription.plan),
    };
  }

  async loadLocal(): Promise<SubscriptionState> {
    const saved = await storage.load<SubscriptionState>(STORAGE_KEYS.SUBSCRIPTION_STATUS);
    return this.getEffectiveSubscription(saved ?? DEFAULT_SUBSCRIPTION);
  }

  async saveLocal(subscription: SubscriptionState): Promise<SubscriptionState> {
    const effective = this.getEffectiveSubscription(subscription);
    await storage.save(STORAGE_KEYS.SUBSCRIPTION_STATUS, effective);
    return effective;
  }

  async syncFromBackend(): Promise<SubscriptionState> {
    const subscription = await apiCall<SubscriptionState>('/subscription/status', 'GET');
    return this.saveLocal(subscription);
  }

  async createCheckout(request: CheckoutRequest): Promise<CheckoutSession> {
    return apiCall<CheckoutSession>('/subscription/checkout', 'POST', request);
  }

  async confirmCheckout(checkoutId: string): Promise<SubscriptionState> {
    const subscription = await apiCall<SubscriptionState>('/subscription/checkout/confirm', 'POST', {
      checkoutId,
    });
    return this.saveLocal(subscription);
  }

  async startUpgrade(request: CheckoutRequest): Promise<SubscriptionState> {
    try {
      const checkout = await this.createCheckout(request);
      return this.confirmCheckout(checkout.checkoutId);
    } catch (error) {
      console.warn('Subscription checkout API unavailable, using local checkout:', error);
      return this.confirmLocalCheckout(request);
    }
  }

  private isExpired(subscription: SubscriptionState): boolean {
    if (subscription.plan === 'free') return false;
    if (subscription.status !== 'active') return true;
    if (!subscription.expiresAt) return false;

    return new Date(subscription.expiresAt).getTime() <= Date.now();
  }

  private async confirmLocalCheckout(request: CheckoutRequest): Promise<SubscriptionState> {
    const now = new Date();
    const expiresAt = new Date(now);

    if (request.interval === 'yearly') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    return this.saveLocal({
      plan: request.plan,
      status: 'active',
      appLimit: this.getLimit(request.plan),
      expiresAt: expiresAt.toISOString(),
      provider: 'local-checkout',
      updatedAt: now.toISOString(),
    });
  }
}

export const subscriptionService = new SubscriptionService();
