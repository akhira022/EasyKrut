import Link from "next/link";
import { auth } from "@/lib/auth";
import { PLAN_DEFINITIONS } from "@/lib/entitlements";
import { isStripeConfigured } from "@/lib/stripe";
import { PricingCheckoutButton } from "@/components/billing/PricingCheckoutButton";

export default async function PricingPage() {
  const plans = Object.values(PLAN_DEFINITIONS);
  const session = await auth();
  const stripeReady = isStripeConfigured();

  return (
    <div className="min-h-screen">
      <header className="app-header">
        <Link href="/" className="font-medium tracking-wide">
          EASYKRUT
        </Link>
        <div className="flex gap-3">
          {session?.user ? (
            <Link href="/dashboard" className="btn-primary">
              แดชบอร์ด
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn-text">
                เข้าสู่ระบบ
              </Link>
              <Link href="/register" className="btn-primary">
                เริ่ม Free
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-3xl font-medium text-center">แผนราคา</h1>
        <p className="text-center text-[var(--text-muted)] mt-2 mb-10">
          {stripeReady
            ? "ชำระเงินผ่าน Stripe Checkout ได้แล้ว"
            : "ใส่ STRIPE_SECRET_KEY และ STRIPE_PRICE_PRO / STRIPE_PRICE_BUSINESS ใน .env เพื่อเปิดชำระเงิน"}
        </p>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className="rounded-2xl border border-[var(--border-color)] bg-white p-6 flex flex-col"
            >
              <h2 className="text-xl font-medium">{plan.name}</h2>
              <p className="mt-3 text-3xl font-medium">
                {plan.priceMonthlyThb === 0 ? "ฟรี" : `฿${plan.priceMonthlyThb}`}
                {plan.priceMonthlyThb > 0 ? (
                  <span className="text-sm font-normal text-[var(--text-muted)]">/เดือน</span>
                ) : null}
              </p>
              <ul className="mt-6 space-y-2 text-sm text-[var(--text-muted)] flex-1">
                <li>สมาชิกสูงสุด {plan.seatLimit} คน</li>
                <li>
                  เอกสาร{" "}
                  {plan.docLimitMonthly === 99999
                    ? "ไม่จำกัด"
                    : `${plan.docLimitMonthly}/เดือน`}
                </li>
                <li>Export PDF {plan.exportPdf ? "ได้" : "ไม่ได้"}</li>
                <li>Export Word {plan.exportWord ? "ได้" : "ไม่ได้"}</li>
              </ul>
              <PricingCheckoutButton
                planKey={plan.key}
                primary={plan.key === "pro"}
                stripeReady={stripeReady}
                loggedIn={Boolean(session?.user)}
                label={
                  plan.key === "free"
                    ? "เริ่มใช้งาน"
                    : plan.key === "pro"
                      ? "อัปเกรด Pro"
                      : "อัปเกรด Business"
                }
              />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
