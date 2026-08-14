"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/lib/actions/auth";
import { acceptInviteRegisterAction } from "@/lib/actions/org";
import { FormField } from "@/components/ui/FormField";

const initial: ActionResult | null = null;

export function AcceptInviteForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(acceptInviteRegisterAction, initial);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <FormField id="invite-name" label="ชื่อ-นามสกุล" error={state?.error}>
        <input className="field" name="name" required minLength={2} autoComplete="name" />
      </FormField>
      <FormField id="invite-password" label="ตั้งรหัสผ่าน" hint="อย่างน้อย 6 ตัวอักษร">
        <input
          className="field"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
        />
      </FormField>
      <button type="submit" className="btn-primary w-full justify-center" disabled={pending}>
        {pending ? "กำลังสมัคร..." : "รับคำเชิญและเข้าใช้งาน"}
      </button>
    </form>
  );
}
