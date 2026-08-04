"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ExternalLetterPayload } from "@/lib/documents/external/schema";
import { ExternalLetterPreview } from "@/components/documents/ExternalLetterPreview";
import { saveDocumentAction } from "@/lib/actions/documents";

type Props = {
  documentId: string;
  initialStatus: "DRAFT" | "FINAL";
  initialPayload: ExternalLetterPayload;
};

export function ExternalEditor({ documentId, initialStatus, initialPayload }: Props) {
  const router = useRouter();
  const [payload, setPayload] = useState<ExternalLetterPayload>(initialPayload);
  const [status, setStatus] = useState<"DRAFT" | "FINAL">(initialStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const title = useMemo(
    () => payload.subject.trim() || "หนังสือภายนอก",
    [payload.subject],
  );

  function update<K extends keyof ExternalLetterPayload>(
    key: K,
    value: ExternalLetterPayload[K],
  ) {
    setPayload((prev) => ({ ...prev, [key]: value }));
  }

  function updateParagraph(index: number, value: string) {
    setPayload((prev) => {
      const paragraphs = [...prev.paragraphs];
      paragraphs[index] = value;
      return { ...prev, paragraphs };
    });
  }

  function addParagraph() {
    setPayload((prev) => ({ ...prev, paragraphs: [...prev.paragraphs, ""] }));
  }

  function save() {
    startTransition(async () => {
      const result = await saveDocumentAction({ id: documentId, status, payload });
      if (!result.ok) {
        setMessage(result.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setMessage("บันทึกแล้ว");
      router.refresh();
    });
  }

  async function exportWord() {
    await saveDocumentAction({ id: documentId, status, payload });
    window.location.href = `/api/export/docx?id=${documentId}`;
  }

  function exportPdf() {
    startTransition(async () => {
      await saveDocumentAction({ id: documentId, status, payload });
      window.open(`/documents/${documentId}/print`, "_blank");
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--text-muted)]">กำลังแก้ไข</p>
          <h1 className="text-xl font-medium text-[var(--text-main)]">{title}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/documents" className="btn-text">
            ประวัติเอกสาร
          </Link>
          <button type="button" className="btn-text" onClick={() => setZoomOpen(true)}>
            ขยายพรีวิว
          </button>
          <button type="button" className="btn-secondary" onClick={exportPdf} disabled={pending}>
            PDF / พิมพ์
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

      <div className="flex flex-wrap gap-4 items-center">
        <label className="text-sm flex items-center gap-2">
          สถานะ
          <select
            className="field"
            value={status}
            onChange={(e) => setStatus(e.target.value as "DRAFT" | "FINAL")}
          >
            <option value="DRAFT">ฉบับร่าง</option>
            <option value="FINAL">ฉบับสมบูรณ์</option>
          </select>
        </label>
        <span className="text-xs text-[var(--text-muted)]">
          ประเภท: หนังสือภายนอก (ประเภทอื่นจะเปิดในเฟสถัดไป)
        </span>
      </div>

      <div className="content-wrapper">
        <section className="form-section">
          <h2>กรอกข้อมูลสำหรับหนังสือภายนอก</h2>

          <div className="form-group">
            <label>ชื่อหน่วยงานเจ้าของหนังสือ</label>
            <input
              className="field"
              value={payload.department}
              onChange={(e) => update("department", e.target.value)}
              placeholder="เช่น กระทรวงมหาดไทย ถนนอัษฎางค์ กทม. ๑๐๒๐๐"
            />
          </div>

          <div className="form-group">
            <label>ชื่อเรื่อง</label>
            <input
              className="field"
              value={payload.subject}
              onChange={(e) => update("subject", e.target.value)}
            />
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
              <label>ประจำปี</label>
              <input
                className="field"
                value={payload.year}
                onChange={(e) => update("year", e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ width: "50%" }}>
            <label>เลขที่หนังสือออก</label>
            <input
              className="field"
              value={payload.docNum}
              onChange={(e) => update("docNum", e.target.value)}
              placeholder="มท ๐๘๐๘.๒/"
            />
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
              <label>ชื่อผู้รับ</label>
              <input
                className="field"
                value={payload.receiver}
                onChange={(e) => update("receiver", e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>สิ่งที่ส่งมาด้วย</label>
              <input
                className="field"
                value={payload.attachment}
                onChange={(e) => update("attachment", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>อ้างถึง</label>
              <input
                className="field"
                value={payload.reference}
                onChange={(e) => update("reference", e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>รายละเอียดเรื่อง</label>
            {payload.paragraphs.map((p, i) => (
              <textarea
                key={i}
                className="field"
                style={{ marginTop: i ? 10 : 0, height: 100 }}
                value={p}
                onChange={(e) => updateParagraph(i, e.target.value)}
              />
            ))}
          </div>
          <button type="button" className="add-paragraph-btn" onClick={addParagraph}>
            + เพิ่มย่อหน้าใหม่
          </button>

          <div className="form-group" style={{ width: "50%" }}>
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
              <label>ลงชื่อ</label>
              <input
                className="field"
                value={payload.signName}
                onChange={(e) => update("signName", e.target.value)}
                placeholder="(ชื่อ-นามสกุล)"
              />
            </div>
            <div className="form-group">
              <label>ตำแหน่ง</label>
              <input
                className="field"
                value={payload.position}
                onChange={(e) => update("position", e.target.value)}
              />
            </div>
          </div>

          <div className="contact-info-section">
            <h3>ข้อมูลติดต่อท้ายหนังสือ</h3>
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
              <label>อีเมล</label>
              <input
                className="field"
                value={payload.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>
          </div>
        </section>

        <aside className="preview-section">
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
