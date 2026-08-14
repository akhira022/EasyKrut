"use client";

import type { ReactNode } from "react";
import Link from "next/link";

type Props = {
  title: string;
  typeLabel: string;
  formTitle: string;
  message: string | null;
  pending: boolean;
  status: "DRAFT" | "FINAL";
  onStatus: (status: "DRAFT" | "FINAL") => void;
  mobileTab: "form" | "preview";
  setMobileTab: (tab: "form" | "preview") => void;
  onSave: () => void;
  onDuplicate: () => void;
  onPdf: () => void;
  onWord: () => void;
  zoomOpen: boolean;
  setZoomOpen: (open: boolean) => void;
  form: ReactNode;
  preview: ReactNode;
  zoomPreview: ReactNode;
};

export function OfficialEditorFrame({
  title,
  typeLabel,
  formTitle,
  message,
  pending,
  status,
  onStatus,
  mobileTab,
  setMobileTab,
  onSave,
  onDuplicate,
  onPdf,
  onWord,
  zoomOpen,
  setZoomOpen,
  form,
  preview,
  zoomPreview,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--text-muted)]">กำลังแก้ไข</p>
          <h1 className="text-xl font-medium text-[var(--text-main)]">{title}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/documents" className="btn-text">
            ประวัติเอกสาร
          </Link>
          <button type="button" className="btn-text" onClick={onDuplicate} disabled={pending}>
            คัดลอก
          </button>
          <button type="button" className="btn-text" onClick={() => setZoomOpen(true)}>
            ขยายพรีวิว
          </button>
          <button type="button" className="btn-secondary" onClick={onPdf} disabled={pending}>
            ดาวน์โหลด PDF
          </button>
          <button type="button" className="btn-secondary" onClick={onWord} disabled={pending}>
            Word
          </button>
          <button type="button" className="btn-primary" onClick={onSave} disabled={pending}>
            {pending ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>

      {message ? (
        <p className="rounded-md bg-[#f3f1ff] px-3 py-2 text-sm text-[var(--primary-color)]">
          {message}
        </p>
      ) : null}

      <div className="mobile-editor-tabs">
        <button
          type="button"
          className={mobileTab === "form" ? "active" : ""}
          onClick={() => setMobileTab("form")}
        >
          ฟอร์ม
        </button>
        <button
          type="button"
          className={mobileTab === "preview" ? "active" : ""}
          onClick={() => setMobileTab("preview")}
        >
          พรีวิว
        </button>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <label className="text-sm flex items-center gap-2">
          สถานะ
          <select
            className="field"
            value={status}
            onChange={(e) => onStatus(e.target.value as "DRAFT" | "FINAL")}
            style={{ width: "auto", marginBottom: 0 }}
          >
            <option value="DRAFT">ฉบับร่าง</option>
            <option value="FINAL">สมบูรณ์</option>
          </select>
        </label>
        <span className="text-sm text-[var(--text-muted)]">{typeLabel}</span>
      </div>

      <div className={`content-wrapper mobile-tab-${mobileTab}`}>
        <section className="form-section editor-form-panel no-print">
          <h2>{formTitle}</h2>
          {form}
        </section>
        <aside className="preview-section editor-preview-panel">
          <div className="preview-label">พรีวิวสด</div>
          <div className="preview-frame">{preview}</div>
        </aside>
      </div>

      {zoomOpen ? (
        <div className="zoom-modal" role="dialog">
          <button type="button" className="zoom-close" onClick={() => setZoomOpen(false)}>
            ปิด
          </button>
          {zoomPreview}
        </div>
      ) : null}
    </div>
  );
}
