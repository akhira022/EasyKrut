"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/lib/actions/auth";
import { FormField } from "@/components/ui/FormField";

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
      <FormField id="tpl-agency" label="ส่วนราชการเจ้าของหนังสือ" error={state?.error}>
        <textarea
          className="field"
          name="agencyName"
          rows={2}
          defaultValue={defaults.agencyName}
          placeholder={"เช่น กรมชลประทาน\nสำนักงานชลประทานที่ ๑๕"}
        />
      </FormField>
      <FormField id="tpl-address" label="ที่ตั้ง">
        <textarea
          className="field"
          name="agencyAddress"
          rows={2}
          defaultValue={defaults.agencyAddress}
          placeholder={"เช่น ตำบล… อำเภอ…\nจังหวัด… รหัสไปรษณีย์"}
        />
      </FormField>
      <FormField id="tpl-unit" label="ส่วนราชการเจ้าของเรื่อง">
        <input className="field" name="contactUnit" defaultValue={defaults.contactUnit} />
      </FormField>
      <FormField id="tpl-prefix" label="คำนำหน้าเลขที่หนังสือ">
        <input className="field" name="docNumPrefix" defaultValue={defaults.docNumPrefix} />
      </FormField>
      <div className="form-row">
        <FormField id="tpl-tel" label="โทร.">
          <input className="field" name="tel" defaultValue={defaults.tel} autoComplete="tel" />
        </FormField>
        <FormField id="tpl-fax" label="โทรสาร">
          <input className="field" name="fax" defaultValue={defaults.fax} />
        </FormField>
      </div>
      <FormField id="tpl-email" label="ไปรษณีย์อิเล็กทรอนิกส์">
        <input
          className="field"
          name="email"
          type="email"
          defaultValue={defaults.email}
          autoComplete="email"
          inputMode="email"
        />
      </FormField>
      {state?.ok ? (
        <p className="text-sm text-green-700" role="status" aria-live="polite">
          บันทึกเทมเพลตแล้ว
        </p>
      ) : null}
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "กำลังบันทึก..." : "บันทึกเทมเพลต"}
      </button>
    </form>
  );
}
