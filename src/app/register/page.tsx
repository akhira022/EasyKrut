"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction, type ActionResult } from "@/lib/actions/auth";
import { FormField } from "@/components/ui/FormField";
import { PublicHeader } from "@/components/nav/PublicHeader";

const initial: ActionResult | null = null;

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerAction, initial);

  return (
    <div className="min-h-screen">
      <PublicHeader />
      <div className="flex items-center justify-center px-4 py-12">
        <div className="auth-card">
          <h1 className="text-2xl font-medium mb-1">สร้างบัญชีหน่วยงาน</h1>
          <p className="text-sm text-[var(--text-muted)] mb-6">
            สมัครแล้วจะได้หน่วยงานแผน Free พร้อมสิทธิ์เจ้าของทันที
          </p>
          <form action={action} className="space-y-4">
            <FormField id="reg-name" label="ชื่อ-นามสกุล" error={state?.error}>
              <input className="field" name="name" required minLength={2} autoComplete="name" />
            </FormField>
            <FormField id="reg-org" label="ชื่อหน่วยงาน">
              <input
                className="field"
                name="organizationName"
                required
                minLength={2}
                autoComplete="organization"
                placeholder="เช่น สำนักปลัดเทศบาล..."
              />
            </FormField>
            <FormField id="reg-email" label="อีเมล">
              <input
                className="field"
                name="email"
                type="email"
                required
                autoComplete="email"
                inputMode="email"
              />
            </FormField>
            <FormField id="reg-password" label="รหัสผ่าน" hint="อย่างน้อย 6 ตัวอักษร">
              <input
                className="field"
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </FormField>
            <button className="btn-primary w-full justify-center" type="submit" disabled={pending}>
              {pending ? "กำลังสมัคร..." : "สมัครและเข้าใช้งาน"}
            </button>
          </form>
          <p className="mt-4 text-sm text-[var(--text-muted)]">
            มีบัญชีแล้ว?{" "}
            <Link href="/login" className="text-[var(--primary-color)]">
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
