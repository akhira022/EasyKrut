"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/lib/actions/auth";

const initial: ActionResult | null = null;

export function TemplateForm({
  action,
  defaults,
}: {
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  defaults: {
    department: string;
    docNumPrefix: string;
    tel: string;
    fax: string;
    email: string;
  };
}) {
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-3">
      <div className="form-group">
        <label>ชื่อหน่วยงานเริ่มต้น</label>
        <input className="field" name="department" defaultValue={defaults.department} />
      </div>
      <div className="form-group">
        <label>คำนำหน้าเลขที่หนังสือ</label>
        <input className="field" name="docNumPrefix" defaultValue={defaults.docNumPrefix} />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>โทร.</label>
          <input className="field" name="tel" defaultValue={defaults.tel} />
        </div>
        <div className="form-group">
          <label>โทรสาร</label>
          <input className="field" name="fax" defaultValue={defaults.fax} />
        </div>
      </div>
      <div className="form-group">
        <label>อีเมล</label>
        <input className="field" name="email" defaultValue={defaults.email} />
      </div>
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state?.ok ? <p className="text-sm text-green-700">บันทึกเทมเพลตแล้ว</p> : null}
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "กำลังบันทึก..." : "บันทึกเทมเพลต"}
      </button>
    </form>
  );
}
