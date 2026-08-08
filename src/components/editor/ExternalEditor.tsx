"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ExternalLetterPayload, Urgency } from "@/lib/documents/external/schema";
import {
  DOC_SOFT_LIMITS,
  bodyTotalChars,
  countChars,
  overSoftLimit,
} from "@/lib/documents/limits";
import { ExternalLetterPreview } from "@/components/documents/ExternalLetterPreview";
import { duplicateDocumentAction, saveDocumentAction } from "@/lib/actions/documents";

type Props = {
  documentId: string;
  initialStatus: "DRAFT" | "FINAL";
  initialPayload: ExternalLetterPayload;
};

const AUTOSAVE_MS = 20_000;

export function ExternalEditor({ documentId, initialStatus, initialPayload }: Props) {
  const router = useRouter();
  const [payload, setPayload] = useState<ExternalLetterPayload>(initialPayload);
  const [status, setStatus] = useState<"DRAFT" | "FINAL">(initialStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"form" | "preview">("form");
  const [pending, startTransition] = useTransition();
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);

  const title = useMemo(
    () => payload.subject.trim() || "หนังสือภายนอก",
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

  function update<K extends keyof ExternalLetterPayload>(
    key: K,
    value: ExternalLetterPayload[K],
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
      const result = await saveDocumentAction({
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
          ประเภท: หนังสือภายนอก (แบบที่ 1 ตามระเบียบสารบรรณ)
        </span>
      </div>

      <div className={`content-wrapper mobile-tab-${mobileTab}`}>
        <section className="form-section editor-form-panel no-print">
          <h2>กรอกข้อมูลสำหรับหนังสือภายนอก</h2>

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
            <label>ส่วนราชการเจ้าของหนังสือ</label>
            <textarea
              className="field"
              rows={2}
              value={payload.agencyName}
              onChange={(e) => update("agencyName", e.target.value)}
              placeholder={"เช่น กรมชลประทาน\nสำนักงานชลประทานที่ ๑๕"}
            />
          </div>

          <div className="form-group">
            <label>ที่ตั้ง</label>
            <textarea
              className="field"
              rows={2}
              value={payload.agencyAddress}
              onChange={(e) => update("agencyAddress", e.target.value)}
              placeholder={"เช่น ตำบล… อำเภอ…\nจังหวัด… รหัสไปรษณีย์"}
            />
          </div>

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
            <div className="form-group">
              <label>วัน เดือน ปี ที่ออก</label>
              <input
                className="field"
                type="date"
                value={payload.date}
                onChange={(e) => update("date", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>เลขที่หนังสือออก</label>
              <input
                className="field"
                value={payload.docNum}
                onChange={(e) => update("docNum", e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 0.5 }}>
              <label>คำขึ้นต้น</label>
              <select
                className="field"
                value={payload.salutation}
                onChange={(e) =>
                  update("salutation", e.target.value as ExternalLetterPayload["salutation"])
                }
              >
                <option value="เรียน">เรียน</option>
                <option value="กราบเรียน">กราบเรียน</option>
              </select>
            </div>
            <div className="form-group" style={{ flex: 1.5 }}>
              <label>ถึง (ตำแหน่งหรือชื่อผู้รับ)</label>
              <textarea
                className="field"
                rows={2}
                value={payload.receiver}
                onChange={(e) => update("receiver", e.target.value)}
                placeholder={"เช่น คุณจักรพงศ์ กุดเสนา\nหัวหน้ากลุ่มงาน…"}
              />
            </div>
          </div>

          <div className="form-group">
            <label>อ้างถึง</label>
            {payload.references.map((item, i) => (
              <div key={i} className="list-field-row">
                <input
                  className="field"
                  value={item}
                  onChange={(e) => updateListItem("references", i, e.target.value)}
                  placeholder="ส่วนราชการ ที่ … ลงวันที่ …"
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
                update("closing", e.target.value as ExternalLetterPayload["closing"])
              }
            >
              <option value="ขอแสดงความนับถือ">ขอแสดงความนับถือ</option>
              <option value="ขอแสดงความเคารพอย่างยิ่ง">ขอแสดงความเคารพอย่างยิ่ง</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>ชื่อเต็มผู้ลงนาม</label>
              <input
                className="field"
                value={payload.signName}
                onChange={(e) => update("signName", e.target.value)}
                placeholder="ชื่อ-นามสกุล (จะแสดงในวงเล็บ)"
              />
            </div>
            <div className="form-group">
              <label>ตำแหน่ง</label>
              <textarea
                className="field"
                rows={2}
                value={payload.position}
                onChange={(e) => update("position", e.target.value)}
                placeholder={"เช่น คณบดีคณะ…\nปฏิบัติราชการแทน อธิการบดี…"}
              />
            </div>
          </div>

          <div className="contact-info-section">
            <h3>ส่วนราชการเจ้าของเรื่องและข้อมูลติดต่อ</h3>
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
                <label>โทรสาร</label>
                <input
                  className="field"
                  value={payload.fax}
                  onChange={(e) => update("fax", e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label>ไปรษณีย์อิเล็กทรอนิกส์</label>
              <input
                className="field"
                type="email"
                value={payload.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>สำเนาส่ง</label>
              <input
                className="field"
                value={payload.cc}
                onChange={(e) => update("cc", e.target.value)}
                placeholder="ถ้ามี — ชื่อส่วนราชการหรือบุคคล"
              />
            </div>
          </div>
        </section>

        <aside className="preview-section editor-preview-panel">
          <div className="preview-label">พรีวิวสด</div>
          <div className="preview-frame">
            <ExternalLetterPreview data={payload} />
          </div>
        </aside>
      </div>

      {zoomOpen ? (
        <div className="zoom-modal" role="dialog">
          <button type="button" className="zoom-close" onClick={() => setZoomOpen(false)}>
            ปิด
          </button>
          <ExternalLetterPreview data={payload} printMode />
        </div>
      ) : null}
    </div>
  );
}
