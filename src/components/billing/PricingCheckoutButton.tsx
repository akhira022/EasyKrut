"use client";

import { useState } from "react";
import Link from "next/link";
import type { PlanKey } from "@/lib/entitlements";

export function PricingCheckoutButton({
  planKey,
  label,
  primary,
  stripeReady,
  loggedIn,
}: {
  planKey: PlanKey;
  label: string;
  primary?: boolean;
  stripeReady: boolean;
  loggedIn: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (planKey === "free") {
    return (
      <Link
        href={loggedIn ? "/dashboard" : "/register"}
        className={`mt-6 text-center ${primary ? "btn-primary" : "btn-secondary"}`}
      >
        {label}
      </Link>
    );
  }

  if (!loggedIn) {
    return (
      <Link href="/login?callbackUrl=/pricing" className="mt-6 text-center btn-secondary">
        เข้าสู่ระบบเพื่ออัปเกรด
      </Link>
    );
  }

  if (!stripeReady) {
    return (
      <button type="button" className="mt-6 btn-secondary" disabled>
        ยังไม่พร้อมรับชำระเงิน
      </button>
    );
  }

  async function startCheckout() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "เริ่ม Checkout ไม่สำเร็จ");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("เริ่ม Checkout ไม่สำเร็จ");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-6 space-y-2">
      <button
        type="button"
        className={`w-full ${primary ? "btn-primary" : "btn-secondary"}`}
        onClick={startCheckout}
        disabled={pending}
      >
        {pending ? "กำลังเปิด Checkout..." : label}
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
