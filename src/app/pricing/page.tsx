import Link from "next/link";
import { PLAN_DEFINITIONS } from "@/lib/entitlements";

export default function PricingPage() {
  const plans = Object.values(PLAN_DEFINITIONS);

  return (
    <div className="min-h-screen">
      <header className="app-header">
        <Link href="/" className="font-medium tracking-wide">
          EASYKRUT
        </Link>
        <div className="flex gap-3">
          <Link href="/login" className="btn-text">
            เข้าสู่ระบบ
          </Link>
          <Link href="/register" className="btn-primary">
            เริ่ม Free
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-3xl font-medium text-center">แผนราคา</h1>
        <p className="text-center text-[var(--text-muted)] mt-2 mb-10">
          โครงสร้างพร้อมหารายได้ — การชำระเงินผ่าน Stripe จะเปิดในเฟสถัดไป
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
                <li>เอกสาร {plan.docLimitMonthly === 99999 ? "ไม่จำกัด" : `${plan.docLimitMonthly}/เดือน`}</li>
                <li>Export PDF {plan.exportPdf ? "ได้" : "ไม่ได้"}</li>
                <li>Export Word {plan.exportWord ? "ได้" : "ไม่ได้"}</li>
              </ul>
              <Link
                href="/register"
                className={`mt-6 text-center ${plan.key === "pro" ? "btn-primary" : "btn-secondary"}`}
              >
                {plan.key === "free" ? "เริ่มใช้งาน" : "สนใจแผนนี้ (เร็วๆ นี้)"}
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
