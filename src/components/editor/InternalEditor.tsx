"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Urgency } from "@/lib/documents/external/schema";
import type { InternalLetterPayload } from "@/lib/documents/internal/schema";
import {
  DOC_SOFT_LIMITS,
  bodyTotalChars,
  countChars,
  overSoftLimit,
} from "@/lib/documents/limits";
import { InternalLetterPreview } from "@/components/documents/InternalLetterPreview";
import { duplicateDocumentAction, saveInternalDocumentAction } from "@/lib/actions/documents";

type Props = {
  documentId: string;
  initialStatus: "DRAFT" | "FINAL";
  initialPayload: InternalLetterPayload;
};

const AUTOSAVE_MS = 20_000;

export function InternalEditor({ documentId, initialStatus, initialPayload }: Props) {
  const router = useRouter();
  const [payload, setPayload] = useState<InternalLetterPayload>(initialPayload);
  const [status, setStatus] = useState<"DRAFT" | "FINAL">(initialStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"form" | "preview">("form");
  const [pending, startTransition] = useTransition();
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);

  const title = useMemo(
    () => payload.subject.trim() || "หนังสือภายใน",
    [payload.subject],
  );

  const bodyChars = useMemo(
    () => bodyTotalChars(payload.paragraphs),
    [payload.paragraphs],
  );
  const bodyOverBudget = bodyChars > DOC_SOFT_LIMITS.bodyTotal;

  function markDirty() {
    dirtyRef.current = true;
  }

  function update<K extends keyof InternalLetterPayload>(
    key: K,
    value: InternalLetterPayload[K],
  ) {
    setPayload((prev) => ({ ...prev, [key]: value }));
    markDirty();
  }

  function updateListItem(
    key: "paragraphs" | "references" | "attachments",
    index: number,
    value: string,
  ) {
    setPayload((prev) => {
      const list = [...prev[key]];
      list[index] = value;
      return { ...prev, [key]: list };
    });
    markDirty();
  }

  function addListItem(key: "paragraphs" | "references" | "attachments") {
    setPayload((prev) => ({ ...prev, [key]: [...prev[key], ""] }));
    markDirty();
  }

  function removeListItem(key: "references" | "attachments", index: number) {
    setPayload((prev) => {
      const list = prev[key].filter((_, i) => i !== index);
      return { ...prev, [key]: list.length ? list : [""] };
    });
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
      const result = await saveInternalDocumentAction({
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
          <h1 className="text-xl font-medium">{title}</h1>
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
          ประเภท: หนังสือภายใน (บันทึกข้อความ)
        </span>
      </div>

      <div className={`content-wrapper mobile-tab-${mobileTab}`}>
        <section className="form-section editor-form-panel no-print">
          <h2>กรอกข้อมูลบันทึกข้อความ</h2>

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
            <label>ส่วนราชการ</label>
            <input
              className="field"
              value={payload.agencyName}
              onChange={(e) => update("agencyName", e.target.value)}
            />
            <label className="editor-checkbox-label">
              <input
                type="checkbox"
                checked={payload.showAgencyRule}
                onChange={(e) => update("showAgencyRule", e.target.checked)}
              />
              แสดงเส้นใต้ส่วนราชการ
            </label>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>ที่</label>
              <input
                className="field"
                value={payload.docNum}
                onChange={(e) => update("docNum", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>วันที่</label>
              <input
                className="field"
                type="date"
                value={payload.date}
                onChange={(e) => update("date", e.target.value)}
              />
            </div>
          </div>
          <label className="editor-checkbox-label">
            <input
              type="checkbox"
              checked={payload.showDocDateRule}
              onChange={(e) => update("showDocDateRule", e.target.checked)}
            />
            แสดงเส้นใต้ที่ / วันที่
          </label>

          <div className="form-group">
            <label>เรื่อง</label>
            <input
              className="field"
              value={payload.subject}
              onChange={(e) => update("subject", e.target.value)}
            />
            <p
              className={`char-count ${overSoftLimit(payload.subject, DOC_SOFT_LIMITS.subject) ? "char-count-warn" : ""}`}
            >
              {countChars(payload.subject)}/{DOC_SOFT_LIMITS.subject} ตัวอักษร
              {overSoftLimit(payload.subject, DOC_SOFT_LIMITS.subject)
                ? " — ยาวเกินแนะนำ"
                : ""}
            </p>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 0.5 }}>
              <label>คำขึ้นต้น</label>
              <select
                className="field"
                value={payload.salutation}
                onChange={(e) =>
                  update("salutation", e.target.value as InternalLetterPayload["salutation"])
                }
              >
                <option value="เรียน">เรียน</option>
                <option value="กราบเรียน">กราบเรียน</option>
              </select>
            </div>
            <div className="form-group" style={{ flex: 1.5 }}>
              <label>ถึง</label>
              <textarea
                className="field"
                rows={2}
                value={payload.receiver}
                onChange={(e) => update("receiver", e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>จาก</label>
            <input
              className="field"
              value={payload.from}
              onChange={(e) => update("from", e.target.value)}
              placeholder="ถ้ามี"
            />
          </div>

          <div className="form-group">
            <label>อ้างถึง</label>
            {payload.references.map((item, i) => (
              <div key={i} className="list-field-row">
                <input
                  className="field"
                  value={item}
                  onChange={(e) => updateListItem("references", i, e.target.value)}
                />
                {payload.references.length > 1 ? (
                  <button
                    type="button"
                    className="btn-text"
                    onClick={() => removeListItem("references", i)}
                  >
                    ลบ
                  </button>
                ) : null}
              </div>
            ))}
            <button type="button" className="btn-text" onClick={() => addListItem("references")}>
              + เพิ่มอ้างถึง
            </button>
          </div>

          <div className="form-group">
            <label>สิ่งที่ส่งมาด้วย</label>
            {payload.attachments.map((item, i) => (
              <div key={i} className="list-field-row">
                <input
                  className="field"
                  value={item}
                  onChange={(e) => updateListItem("attachments", i, e.target.value)}
                />
                {payload.attachments.length > 1 ? (
                  <button
                    type="button"
                    className="btn-text"
                    onClick={() => removeListItem("attachments", i)}
                  >
                    ลบ
                  </button>
                ) : null}
              </div>
            ))}
            <button type="button" className="btn-text" onClick={() => addListItem("attachments")}>
              + เพิ่มสิ่งที่ส่งมาด้วย
            </button>
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
                    onChange={(e) => updateListItem("paragraphs", i, e.target.value)}
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
            <button type="button" className="btn-text" onClick={() => addListItem("paragraphs")}>
              + เพิ่มย่อหน้าใหม่
            </button>
          </div>

          <div className="form-group">
            <label>คำลงท้าย</label>
            <select
              className="field"
              value={payload.closing}
              onChange={(e) =>
                update("closing", e.target.value as InternalLetterPayload["closing"])
              }
            >
              <option value="จึงเรียนมาเพื่อโปรดทราบ">จึงเรียนมาเพื่อโปรดทราบ</option>
              <option value="จึงเรียนมาเพื่อโปรดพิจารณา">จึงเรียนมาเพื่อโปรดพิจารณา</option>
              <option value="จึงเรียนมาเพื่อโปรดดำเนินการ">จึงเรียนมาเพื่อโปรดดำเนินการ</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>ชื่อเต็มผู้ลงนาม</label>
              <input
                className="field"
                value={payload.signName}
                onChange={(e) => update("signName", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>ตำแหน่ง</label>
              <textarea
                className="field"
                rows={2}
                value={payload.position}
                onChange={(e) => update("position", e.target.value)}
              />
            </div>
          </div>
        </section>

        <aside className="preview-section editor-preview-panel">
          <div className="preview-label">พรีวิวสด</div>
          <div className="preview-frame">
            <InternalLetterPreview data={payload} />
          </div>
        </aside>
      </div>

      {zoomOpen ? (
        <div className="zoom-modal" role="dialog">
          <button type="button" className="zoom-close" onClick={() => setZoomOpen(false)}>
            ปิด
          </button>
          <InternalLetterPreview data={payload} printMode />
        </div>
      ) : null}
    </div>
  );
}
