"use client";

export function PrintActions({ title }: { title: string }) {
  return (
    <div className="no-print flex justify-center gap-3 mb-4">
      <button type="button" className="btn-primary" onClick={() => window.print()}>
        พิมพ์ / บันทึกเป็น PDF
      </button>
      <button type="button" className="btn-secondary" onClick={() => window.close()}>
        ปิด
      </button>
      <span className="self-center text-sm text-[var(--text-muted)]">{title}</span>
    </div>
  );
}
