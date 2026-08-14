import { auth } from "@/lib/auth";
import { PLAN_DEFINITIONS } from "@/lib/entitlements";
import { isStripeConfigured } from "@/lib/stripe";
import { getActiveMembership } from "@/lib/org-context";
import { PricingCheckoutButton } from "@/components/billing/PricingCheckoutButton";
import { AppHeader } from "@/components/nav/AppHeader";
import { PublicHeader } from "@/components/nav/PublicHeader";

export default async function PricingPage() {
  const plans = Object.values(PLAN_DEFINITIONS);
  const session = await auth();
  const stripeReady = isStripeConfigured();
  const membership = session?.user?.id
    ? await getActiveMembership(session.user.id)
    : null;

  return (
    <div className="min-h-screen">
      {session?.user ? (
        <AppHeader
          userName={session.user.name ?? ""}
          orgName={membership?.organization.name ?? "—"}
        />
      ) : (
        <PublicHeader primaryHref="/register" primaryLabel="เริ่ม Free" />
      )}

      <main className={session?.user ? "app-main" : "mx-auto max-w-5xl px-4 sm:px-6 py-16"}>
        <h1 className="text-3xl font-medium text-center">แผนราคา</h1>
        <p className="text-center text-[var(--text-muted)] mt-2 mb-10">
          {stripeReady
            ? "เลือกแผนแล้วชำระเงินเพื่อเพิ่มโควตาเอกสารและสมาชิก"
            : "ขณะนี้รับชำระเงินอัตโนมัติยังไม่พร้อม — สมัครแผน Free ได้ทันที หรือติดต่อผู้ดูแลเมื่อต้องการอัปเกรด"}
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
                <li>ดาวน์โหลด PDF {plan.exportPdf ? "ได้" : "ไม่ได้"}</li>
                <li>ดาวน์โหลด Word {plan.exportWord ? "ได้" : "ไม่ได้"}</li>
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
