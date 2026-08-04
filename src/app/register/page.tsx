"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction, type ActionResult } from "@/lib/actions/auth";

const initial: ActionResult | null = null;

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerAction, initial);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="auth-card">
        <h1 className="text-2xl font-medium mb-1">สร้างบัญชีหน่วยงาน</h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          สมัครแล้วจะได้หน่วยงานแผน Free พร้อมสิทธิ์เจ้าของทันที
        </p>
        <form action={action} className="space-y-4">
          <div className="form-group">
            <label>ชื่อ-นามสกุล</label>
            <input className="field" name="name" required minLength={2} />
          </div>
          <div className="form-group">
            <label>ชื่อหน่วยงาน</label>
            <input
              className="field"
              name="organizationName"
              required
              minLength={2}
              placeholder="เช่น สำนักปลัดเทศบาล..."
            />
          </div>
          <div className="form-group">
            <label>อีเมล</label>
            <input className="field" name="email" type="email" required />
          </div>
          <div className="form-group">
            <label>รหัสผ่าน</label>
            <input className="field" name="password" type="password" required minLength={6} />
          </div>
          {state?.error ? (
            <p className="text-sm text-red-600">{state.error}</p>
          ) : null}
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
  );
}
