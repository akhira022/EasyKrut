import { NextResponse } from "next/server";
import { MembershipRole } from "@/lib/constants";
import { appBaseUrl } from "@/lib/mail";
import { requireOrgContext } from "@/lib/org-context";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export async function POST() {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "ขณะนี้ยังไม่พร้อมจัดการการสมัคร" },
        { status: 503 },
      );
    }
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: "ระบบชำระเงินยังไม่พร้อม" }, { status: 503 });
    }

    const ctx = await requireOrgContext([
      MembershipRole.OWNER,
      MembershipRole.ADMIN,
    ]);

    if (!ctx.organization.stripeCustomerId) {
      return NextResponse.json(
        { error: "ยังไม่มีข้อมูลการสมัคร — อัปเกรดแผนก่อน" },
        { status: 400 },
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: ctx.organization.stripeCustomerId,
      return_url: `${appBaseUrl()}/org/settings`,
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
    console.error("[stripe:portal]", e);
    return NextResponse.json({ error: "เปิด Billing Portal ไม่สำเร็จ" }, { status: 500 });
  }
}
