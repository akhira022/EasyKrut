"use client";

import { useEffect } from "react";

export default function AppError({
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
    <div className="space-y-4 max-w-xl">
      <h1 className="text-2xl font-medium">เกิดข้อผิดพลาด</h1>
      <p className="text-sm text-[var(--text-muted)]">
        ไม่สามารถโหลดหน้านี้ได้ ลองใหม่อีกครั้งหรือกลับไปแดชบอร์ด
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary" onClick={reset}>
          ลองใหม่
        </button>
        <a href="/dashboard" className="btn-secondary">
          กลับแดชบอร์ด
        </a>
      </div>
    </div>
  );
}
