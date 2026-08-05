import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import {
  getStripe,
  limitsForPlan,
  planKeyFromPriceId,
} from "@/lib/stripe";
import type { PlanKey } from "@/lib/entitlements";

export const runtime = "nodejs";

async function applyPlan(organizationId: string, planKey: PlanKey) {
  const limits = limitsForPlan(planKey);
  await prisma.organization.update({
    where: { id: organizationId },
    data: limits,
  });
}

export async function POST(req: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "webhook not configured" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (e) {
    console.error("[stripe:webhook] signature", e);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const organizationId = session.metadata?.organizationId;
        const planKey = (session.metadata?.planKey as PlanKey | undefined) || null;
        if (organizationId && (planKey === "pro" || planKey === "business")) {
          await applyPlan(organizationId, planKey);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        const organizationId =
          sub.metadata?.organizationId ||
          (typeof sub.customer === "string"
            ? (
                await prisma.organization.findFirst({
                  where: { stripeCustomerId: sub.customer },
                })
              )?.id
            : undefined);
        const priceId = sub.items.data[0]?.price?.id;
        const planKey =
          (sub.metadata?.planKey as PlanKey | undefined) ||
          (priceId ? planKeyFromPriceId(priceId) : null);
        if (organizationId && planKey && planKey !== "free") {
          if (sub.status === "active" || sub.status === "trialing") {
            await applyPlan(organizationId, planKey);
          }
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const org =
          sub.metadata?.organizationId
            ? await prisma.organization.findUnique({
                where: { id: sub.metadata.organizationId },
              })
            : typeof sub.customer === "string"
              ? await prisma.organization.findFirst({
                  where: { stripeCustomerId: sub.customer },
                })
              : null;
        if (org) {
          await applyPlan(org.id, "free");
        }
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("[stripe:webhook] handler", e);
    return NextResponse.json({ error: "handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
