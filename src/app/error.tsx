"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="auth-card space-y-4">
        <h1 className="text-2xl font-medium">เกิดข้อผิดพลาด</h1>
        <p className="text-sm text-[var(--text-muted)]">
          ไม่สามารถโหลดหน้านี้ได้ ลองใหม่อีกครั้งหรือกลับหน้าแรก
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={reset}>
            ลองใหม่
          </button>
          <Link href="/" className="btn-secondary">
            หน้าแรก
          </Link>
        </div>
      </div>
    </div>
  );
}
