import Stripe from "stripe";
import type { PlanKey } from "@/lib/entitlements";
import { getPlan } from "@/lib/entitlements";

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key);
}

export function isStripeConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() &&
      (process.env.STRIPE_PRICE_PRO?.trim() ||
        process.env.STRIPE_PRICE_BUSINESS?.trim()),
  );
}

export function priceIdForPlan(planKey: PlanKey): string | null {
  if (planKey === "pro") return process.env.STRIPE_PRICE_PRO?.trim() || null;
  if (planKey === "business")
    return process.env.STRIPE_PRICE_BUSINESS?.trim() || null;
  return null;
}

export function planKeyFromPriceId(priceId: string): PlanKey | null {
  if (priceId && priceId === process.env.STRIPE_PRICE_PRO?.trim()) return "pro";
  if (priceId && priceId === process.env.STRIPE_PRICE_BUSINESS?.trim())
    return "business";
  return null;
}

export function limitsForPlan(planKey: PlanKey) {
  const plan = getPlan(planKey);
  return {
    planKey: plan.key,
    seatLimit: plan.seatLimit,
    docLimitMonthly: plan.docLimitMonthly,
  };
}
