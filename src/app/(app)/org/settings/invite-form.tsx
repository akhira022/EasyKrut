"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/lib/actions/auth";
import { FormField } from "@/components/ui/FormField";

const initial: ActionResult | null = null;

export function InviteForm({
  action,
}: {
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
}) {
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-3">
      <div className="form-row">
        <FormField id="invite-email" label="อีเมล" error={state?.error}>
          <input
            className="field"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
          />
        </FormField>
        <FormField id="invite-role" label="บทบาท">
          <select className="field" name="role" defaultValue="MEMBER">
            <option value="MEMBER">สมาชิก</option>
            <option value="ADMIN">ผู้ดูแล</option>
          </select>
        </FormField>
      </div>
      {state?.message ? (
        <p className="text-sm text-green-700 break-all" role="status" aria-live="polite">
          {state.message}
        </p>
      ) : null}
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "กำลังสร้าง..." : "สร้างคำเชิญ"}
      </button>
    </form>
  );
}
