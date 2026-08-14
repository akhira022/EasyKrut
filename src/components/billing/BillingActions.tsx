"use client";

import { useState } from "react";
import Link from "next/link";

export function BillingActions({
  stripeReady,
  hasCustomer,
}: {
  stripeReady: boolean;
  hasCustomer: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "เปิดพอร์ทัลไม่สำเร็จ");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("เปิดพอร์ทัลไม่สำเร็จ");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Link href="/pricing" className="btn-secondary">
        ดูแผนราคา / อัปเกรด
      </Link>
      {stripeReady && hasCustomer ? (
        <button
          type="button"
          className="btn-text"
          onClick={openPortal}
          disabled={pending}
        >
          {pending ? "กำลังเปิด..." : "จัดการการสมัคร"}
        </button>
      ) : null}
      {error ? <p className="text-xs text-red-600 w-full">{error}</p> : null}
    </div>
  );
}
