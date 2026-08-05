"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/lib/actions/auth";
import { acceptInviteLoggedInAction } from "@/lib/actions/org";

const initial: ActionResult | null = null;

export function AcceptInviteLoggedInForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(acceptInviteLoggedInAction, initial);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <p className="text-sm text-[var(--text-muted)]">
        คุณเข้าสู่ระบบแล้ว — กดยืนยันเพื่อเข้าร่วมหน่วยงาน
      </p>
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      <button type="submit" className="btn-primary w-full justify-center" disabled={pending}>
        {pending ? "กำลังรับคำเชิญ..." : "ยืนยันรับคำเชิญ"}
      </button>
    </form>
  );
}
