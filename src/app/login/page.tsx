"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { loginAction, type ActionResult } from "@/lib/actions/auth";
import { Suspense } from "react";

const initial: ActionResult | null = null;

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div className="form-group">
        <label>อีเมล</label>
        <input className="field" name="email" type="email" required />
      </div>
      <div className="form-group">
        <label>รหัสผ่าน</label>
        <input className="field" name="password" type="password" required minLength={6} />
      </div>
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      <button className="btn-primary w-full justify-center" type="submit" disabled={pending}>
        {pending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="auth-card">
        <h1 className="text-2xl font-medium mb-1">เข้าสู่ระบบ</h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">EasyKrut สำหรับหน่วยงานของคุณ</p>
        <Suspense fallback={<p className="text-sm">กำลังโหลด...</p>}>
          <LoginForm />
        </Suspense>
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          ยังไม่มีบัญชี?{" "}
          <Link href="/register" className="text-[var(--primary-color)]">
            สมัครใช้งาน
          </Link>
        </p>
      </div>
    </div>
  );
}
