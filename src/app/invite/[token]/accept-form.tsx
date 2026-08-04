"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/lib/actions/auth";
import { acceptInviteRegisterAction } from "@/lib/actions/org";

const initial: ActionResult | null = null;

export function AcceptInviteForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(acceptInviteRegisterAction, initial);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div className="form-group">
        <label>ชื่อ-นามสกุล</label>
        <input className="field" name="name" required minLength={2} />
      </div>
      <div className="form-group">
        <label>ตั้งรหัสผ่าน</label>
        <input className="field" name="password" type="password" required minLength={6} />
      </div>
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      <button type="submit" className="btn-primary w-full justify-center" disabled={pending}>
        {pending ? "กำลังสมัคร..." : "รับคำเชิญและเข้าใช้งาน"}
      </button>
    </form>
  );
}
