"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Urgency } from "@/lib/documents/external/schema";
import type { StampLetterPayload } from "@/lib/documents/stamp/schema";
import {
  DOC_SOFT_LIMITS,
  bodyTotalChars,
  countChars,
  overSoftLimit,
} from "@/lib/documents/limits";
import { StampLetterPreview } from "@/components/documents/StampLetterPreview";
import { duplicateDocumentAction, saveStampDocumentAction } from "@/lib/actions/documents";

type Props = {
  documentId: string;
  initialStatus: "DRAFT" | "FINAL";
  initialPayload: StampLetterPayload;
};

const AUTOSAVE_MS = 20_000;

export function StampEditor({ documentId, initialStatus, initialPayload }: Props) {
  const router = useRouter();
  const [payload, setPayload] = useState<StampLetterPayload>(initialPayload);
  const [status, setStatus] = useState<"DRAFT" | "FINAL">(initialStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"form" | "preview">("form");
  const [pending, startTransition] = useTransition();
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);

  const title = useMemo(() => {
    const first = (payload.paragraphs || [])
      .map((p) => p.replace(/\s+/g, " ").trim())
      .find((p) => p.length > 0);
    if (first) return first.length > 60 ? `${first.slice(0, 60)}…` : first;
    const to = payload.to.trim();
    if (to) return `ถึง ${to.split(/\r?\n/)[0]!.trim()}`;
    return "หนังสือประทับตรา";
  }, [payload.paragraphs, payload.to]);

  const bodyChars = useMemo(
    () => bodyTotalChars(payload.paragraphs),
    [payload.paragraphs],
  );
  const bodyOverBudget = bodyChars > DOC_SOFT_LIMITS.bodyTotal;

  function markDirty() {
    dirtyRef.current = true;
  }

  function update<K extends keyof StampLetterPayload>(
    key: K,
    value: StampLetterPayload[K],
  ) {
    setPayload((prev) => ({ ...prev, [key]: value }));
    markDirty();
  }

  function updateParagraph(index: number, value: string) {
    setPayload((prev) => {
      const list = [...prev.paragraphs];
      list[index] = value;
      return { ...prev, paragraphs: list };
    });
    markDirty();
  }

  function addParagraph() {
    setPayload((prev) => ({ ...prev, paragraphs: [...prev.paragraphs, ""] }));
    markDirty();
  }

  function removeParagraph(index: number) {
    if (index <= 0) return;
    const ok = window.confirm(`ต้องการลบย่อหน้า ${index + 1} หรือไม่?`);
    if (!ok) return;
    setPayload((prev) => ({
      ...prev,
      paragraphs: prev.paragraphs.filter((_, i) => i !== index),
    }));
    markDirty();
  }

  const persist = useEffectEvent(async (opts?: { silent?: boolean }) => {
    if (savingRef.current) return false;
    savingRef.current = true;
    try {
      const result = await saveStampDocumentAction({
        id: documentId,
        status,
        payload,
      });
      if (!result.ok) {
        if (!opts?.silent) setMessage(result.error ?? "บันทึกไม่สำเร็จ");
        return false;
      }
      dirtyRef.current = false;
      setMessage(opts?.silent ? "บันทึกอัตโนมัติแล้ว" : "บันทึกแล้ว");
      return true;
    } finally {
      savingRef.current = false;
    }
  });

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!dirtyRef.current) return;
      void persist({ silent: true });
    }, AUTOSAVE_MS);
    return () => window.clearInterval(id);
  }, [persist]);

  function save() {
    startTransition(async () => {
      const ok = await persist();
      if (ok) router.refresh();
    });
  }

  function duplicate() {
    startTransition(async () => {
      await persist({ silent: true });
      const result = await duplicateDocumentAction(documentId);
      if (!result.ok || !result.documentId) {
        setMessage(result.error ?? "คัดลอกไม่สำเร็จ");
        return;
      }
      router.push(`/documents/${result.documentId}`);
    });
  }

  async function exportWord() {
    await persist({ silent: true });
    window.location.href = `/api/export/docx?id=${documentId}`;
  }

  function exportPdf() {
    startTransition(async () => {
      await persist({ silent: true });
      window.location.href = `/api/export/pdf?id=${documentId}`;
    });
  }

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
          <button type="button" className="btn-text" onClick={duplicate} disabled={pending}>
            คัดลอก
          </button>
          <button type="button" className="btn-text" onClick={() => setZoomOpen(true)}>
            ขยายพรีวิว
          </button>
          <button type="button" className="btn-secondary" onClick={exportPdf} disabled={pending}>
            ดาวน์โหลด PDF
          </button>
          <button type="button" className="btn-secondary" onClick={exportWord} disabled={pending}>
            Word
          </button>
          <button type="button" className="btn-primary" onClick={save} disabled={pending}>
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
            onChange={(e) => {
              setStatus(e.target.value as "DRAFT" | "FINAL");
              markDirty();
            }}
            style={{ width: "auto", marginBottom: 0 }}
          >
            <option value="DRAFT">ฉบับร่าง</option>
            <option value="FINAL">สมบูรณ์</option>
          </select>
        </label>
        <span className="text-sm text-[var(--text-muted)]">
          ประเภท: หนังสือประทับตรา (แบบที่ 3)
        </span>
      </div>

      <div className={`content-wrapper mobile-tab-${mobileTab}`}>
        <section className="form-section editor-form-panel no-print">
          <h2>กรอกข้อมูลหนังสือประทับตรา</h2>

          <div className="form-group">
            <label>ชั้นความเร็ว</label>
            <select
              className="field"
              value={payload.urgency}
              onChange={(e) => update("urgency", e.target.value as Urgency)}
            >
              <option value="">ปกติ (ไม่ระบุ)</option>
              <option value="ด่วน">ด่วน</option>
              <option value="ด่วนมาก">ด่วนมาก</option>
              <option value="ด่วนที่สุด">ด่วนที่สุด</option>
            </select>
          </div>

          <div className="form-group">
            <label>ที่</label>
            <input
              className="field"
              value={payload.docNum}
              onChange={(e) => update("docNum", e.target.value)}
              placeholder="เช่น อว ๐๙๐๕.๓๕/๑๒๓"
            />
          </div>

          <div className="form-group">
            <label>ถึง</label>
            <textarea
              className="field"
              rows={2}
              value={payload.to}
              onChange={(e) => update("to", e.target.value)}
              placeholder="ส่วนราชการ หน่วยงาน หรือบุคคลที่หนังสือมีถึง"
            />
          </div>

          <div className="form-group">
            <label>ข้อความ</label>
            {bodyOverBudget ? (
              <p className="char-budget-banner">
                รวมข้อความ {bodyChars}/{DOC_SOFT_LIMITS.bodyTotal} ตัวอักษร —
                อาจเกิน 1 หน้า A4 (ยังบันทึก/ส่งออกได้)
              </p>
            ) : (
              <p className="char-count">
                รวมข้อความ {bodyChars}/{DOC_SOFT_LIMITS.bodyTotal} ตัวอักษร (แนะนำไม่เกินเพื่ออยู่หน้าเดียว)
              </p>
            )}
            {payload.paragraphs.map((p, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <div className="list-field-row" style={{ alignItems: "flex-start" }}>
                  <textarea
                    className="field"
                    rows={4}
                    value={p}
                    onChange={(e) => updateParagraph(i, e.target.value)}
                    style={{ marginBottom: 0 }}
                  />
                  {i > 0 ? (
                    <button
                      type="button"
                      className="btn-text"
                      onClick={() => removeParagraph(i)}
                      style={{ marginTop: 6 }}
                    >
                      ลบ
                    </button>
                  ) : null}
                </div>
                <p
                  className={`char-count ${overSoftLimit(p, DOC_SOFT_LIMITS.paragraph) ? "char-count-warn" : ""}`}
                >
                  ย่อหน้า {i + 1}: {countChars(p)}/{DOC_SOFT_LIMITS.paragraph}
                  {overSoftLimit(p, DOC_SOFT_LIMITS.paragraph) ? " — ยาวเกินแนะนำ" : ""}
                </p>
              </div>
            ))}
            <button type="button" className="btn-text" onClick={addParagraph}>
              + เพิ่มย่อหน้าใหม่
            </button>
          </div>

          <div className="form-group">
            <label>ชื่อส่วนราชการที่ส่งหนังสือออก</label>
            <input
              className="field"
              value={payload.senderAgency}
              onChange={(e) => update("senderAgency", e.target.value)}
              placeholder="เหนือตราประทับ"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>ลายมือชื่อย่อกำกับตรา</label>
              <input
                className="field"
                value={payload.initials}
                onChange={(e) => update("initials", e.target.value)}
                placeholder="เช่น ส.ส."
              />
            </div>
            <div className="form-group">
              <label>วัน เดือน ปี ที่ออก</label>
              <input
                className="field"
                type="date"
                value={payload.date}
                onChange={(e) => update("date", e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>ส่วนราชการเจ้าของเรื่อง</label>
            <input
              className="field"
              value={payload.contactUnit}
              onChange={(e) => update("contactUnit", e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>โทร.</label>
              <input
                className="field"
                value={payload.tel}
                onChange={(e) => update("tel", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>ที่ตั้ง</label>
              <textarea
                className="field"
                rows={2}
                value={payload.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="ถ้ามี"
              />
            </div>
          </div>
        </section>

        <aside className="preview-section editor-preview-panel">
          <div className="preview-label">พรีวิวสด</div>
          <div className="preview-frame">
            <StampLetterPreview data={payload} />
          </div>
        </aside>
      </div>

      {zoomOpen ? (
        <div className="zoom-modal" role="dialog">
          <button type="button" className="zoom-close" onClick={() => setZoomOpen(false)}>
            ปิด
          </button>
          <StampLetterPreview data={payload} printMode />
        </div>
      ) : null}
    </div>
  );
}
