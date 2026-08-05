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
    agencyName: string;
    agencyAddress: string;
    contactUnit: string;
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
        <label>ส่วนราชการเจ้าของหนังสือ</label>
        <textarea
          className="field"
          name="agencyName"
          rows={2}
          defaultValue={defaults.agencyName}
          placeholder={"เช่น กรมชลประทาน\nสำนักงานชลประทานที่ ๑๕"}
        />
      </div>
      <div className="form-group">
        <label>ที่ตั้ง</label>
        <textarea
          className="field"
          name="agencyAddress"
          rows={2}
          defaultValue={defaults.agencyAddress}
          placeholder={"เช่น ตำบล… อำเภอ…\nจังหวัด… รหัสไปรษณีย์"}
        />
      </div>
      <div className="form-group">
        <label>ส่วนราชการเจ้าของเรื่อง</label>
        <input className="field" name="contactUnit" defaultValue={defaults.contactUnit} />
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
        <label>ไปรษณีย์อิเล็กทรอนิกส์</label>
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
