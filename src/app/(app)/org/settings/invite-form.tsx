"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/lib/actions/auth";

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
        <div className="form-group">
          <label>อีเมล</label>
          <input className="field" name="email" type="email" required />
        </div>
        <div className="form-group" style={{ flex: 0.6 }}>
          <label>บทบาท</label>
          <select className="field" name="role" defaultValue="MEMBER">
            <option value="MEMBER">MEMBER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
      </div>
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state?.message ? (
        <p className="text-sm text-green-700 break-all">{state.message}</p>
      ) : null}
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "กำลังสร้าง..." : "สร้างคำเชิญ"}
      </button>
    </form>
  );
}
