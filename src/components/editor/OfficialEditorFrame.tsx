"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { MobileActionBar } from "@/components/ui/MobileActionBar";
import {
  persistStatusLabel,
  type MessageTone,
  type PersistStatus,
} from "@/components/editor/useDocumentPersistence";

type Props = {
  title: string;
  typeLabel: string;
  formTitle: string;
  message: string | null;
  messageTone?: MessageTone;
  persistStatus?: PersistStatus;
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
  messageTone = "info",
  persistStatus = "idle",
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
  const closeRef = useRef<HTMLButtonElement>(null);
  const busy = pending || persistStatus === "saving";

  useEffect(() => {
    if (!zoomOpen) return;
    closeRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setZoomOpen(false);
      if (e.key === "Tab") {
        e.preventDefault();
        closeRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomOpen, setZoomOpen]);

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-[var(--text-muted)]">กำลังแก้ไข</p>
          <h1 className="text-xl font-medium text-[var(--text-main)]">{title}</h1>
          <p className="text-xs text-[var(--text-muted)] mt-1" aria-live="polite">
            {persistStatusLabel(persistStatus)}
          </p>
        </div>
        <MobileActionBar>
          <button type="button" className="btn-primary" onClick={onSave} disabled={busy}>
            {busy ? "กำลังบันทึก..." : "บันทึก"}
          </button>
          <button type="button" className="btn-secondary" onClick={onPdf} disabled={busy}>
            ดาวน์โหลด PDF
          </button>
          <button type="button" className="btn-secondary" onClick={onWord} disabled={busy}>
            ดาวน์โหลด Word
          </button>
          <details className="editor-more relative">
            <summary className="btn-text">เพิ่มเติม</summary>
            <div className="absolute right-3 mt-2 rounded-xl border border-[var(--border-color)] bg-white p-2 shadow-sm z-20 flex flex-col">
              <button type="button" className="btn-text" onClick={onDuplicate} disabled={busy}>
                คัดลอก
              </button>
              <button type="button" className="btn-text" onClick={() => setZoomOpen(true)}>
                ขยายพรีวิว
              </button>
              <Link href="/documents" className="btn-text">
                ประวัติเอกสาร
              </Link>
            </div>
          </details>
          <div className="desktop-only gap-2">
            <button type="button" className="btn-text" onClick={onDuplicate} disabled={busy}>
              คัดลอก
            </button>
            <button type="button" className="btn-text" onClick={() => setZoomOpen(true)}>
              ขยายพรีวิว
            </button>
            <Link href="/documents" className="btn-text">
              ประวัติเอกสาร
            </Link>
          </div>
        </MobileActionBar>
      </div>

      {message ? <Alert tone={messageTone}>{message}</Alert> : null}

      <div className="mobile-editor-tabs" role="tablist" aria-label="สลับฟอร์มและพรีวิว">
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === "form"}
          className={mobileTab === "form" ? "active" : ""}
          onClick={() => setMobileTab("form")}
        >
          ฟอร์ม
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === "preview"}
          className={mobileTab === "preview" ? "active" : ""}
          onClick={() => setMobileTab("preview")}
        >
          พรีวิว
        </button>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <label className="text-sm flex items-center gap-2" htmlFor="doc-status">
          สถานะ
        </label>
        <select
          id="doc-status"
          className="field"
          value={status}
          onChange={(e) => onStatus(e.target.value as "DRAFT" | "FINAL")}
          style={{ width: "auto", marginBottom: 0 }}
        >
          <option value="DRAFT">ฉบับร่าง</option>
          <option value="FINAL">สมบูรณ์</option>
        </select>
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
        <div className="zoom-modal" role="dialog" aria-modal="true" aria-labelledby="zoom-title">
          <h2 id="zoom-title" className="sr-only">
            พรีวิวขนาดจริง
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="zoom-close"
            onClick={() => setZoomOpen(false)}
          >
            ปิด
          </button>
          {zoomPreview}
        </div>
      ) : null}
    </div>
  );
}
