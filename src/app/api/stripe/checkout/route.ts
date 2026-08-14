import { NextResponse } from "next/server";
import type { PlanKey } from "@/lib/entitlements";
import { prisma } from "@/lib/db";
import { appBaseUrl } from "@/lib/mail";
import { requireOrgContext } from "@/lib/org-context";
import {
  getStripe,
  isStripeConfigured,
  priceIdForPlan,
} from "@/lib/stripe";
import { MembershipRole } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "ขณะนี้ยังไม่พร้อมรับชำระเงิน" },
        { status: 503 },
      );
    }

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: "ระบบชำระเงินยังไม่พร้อม" }, { status: 503 });
    }

    const body = (await req.json()) as { planKey?: string };
    const planKey = body.planKey as PlanKey | undefined;
    if (planKey !== "pro" && planKey !== "business") {
      return NextResponse.json({ error: "แผนไม่ถูกต้อง" }, { status: 400 });
    }

    const priceId = priceIdForPlan(planKey);
    if (!priceId) {
      return NextResponse.json(
        { error: `ยังไม่มี Stripe Price สำหรับแผน ${planKey}` },
        { status: 503 },
      );
    }

    const ctx = await requireOrgContext([
      MembershipRole.OWNER,
      MembershipRole.ADMIN,
    ]);

    let customerId = ctx.organization.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: ctx.user.email ?? undefined,
        name: ctx.organization.name,
        metadata: { organizationId: ctx.organization.id },
      });
      customerId = customer.id;
      await prisma.organization.update({
        where: { id: ctx.organization.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const base = appBaseUrl();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/org/settings?billing=success`,
      cancel_url: `${base}/pricing?billing=cancel`,
      metadata: {
        organizationId: ctx.organization.id,
        planKey,
      },
      subscription_data: {
        metadata: {
          organizationId: ctx.organization.id,
          planKey,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (msg === "FORBIDDEN") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[stripe:checkout]", e);
    return NextResponse.json({ error: "สร้าง Checkout ไม่สำเร็จ" }, { status: 500 });
  }
}
