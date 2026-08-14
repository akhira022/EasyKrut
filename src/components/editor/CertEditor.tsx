"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CertLetterPayload } from "@/lib/documents/cert/schema";
import { DOC_SOFT_LIMITS, bodyTotalChars } from "@/lib/documents/limits";
import { CertLetterPreview } from "@/components/documents/CertLetterPreview";
import { OfficialEditorFrame } from "@/components/editor/OfficialEditorFrame";
import { duplicateDocumentAction, saveCertDocumentAction } from "@/lib/actions/documents";

type Props = {
  documentId: string;
  initialStatus: "DRAFT" | "FINAL";
  initialPayload: CertLetterPayload;
};

export function CertEditor({ documentId, initialStatus, initialPayload }: Props) {
  const router = useRouter();
  const [payload, setPayload] = useState(initialPayload);
  const [status, setStatus] = useState<"DRAFT" | "FINAL">(initialStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"form" | "preview">("form");
  const [pending, startTransition] = useTransition();
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);

  const title = useMemo(
    () => (payload.certifiedName.trim() ? `รับรอง ${payload.certifiedName}` : "หนังสือรับรอง"),
    [payload.certifiedName],
  );
  const bodyChars = useMemo(() => bodyTotalChars(payload.paragraphs), [payload.paragraphs]);

  function markDirty() {
    dirtyRef.current = true;
  }
  function update<K extends keyof CertLetterPayload>(key: K, value: CertLetterPayload[K]) {
    setPayload((prev) => ({ ...prev, [key]: value }));
    markDirty();
  }

  const persist = useEffectEvent(async (opts?: { silent?: boolean }) => {
    if (savingRef.current) return false;
    savingRef.current = true;
    try {
      const result = await saveCertDocumentAction({ id: documentId, status, payload });
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
    }, 20_000);
    return () => window.clearInterval(id);
  }, [persist]);

  const form = (
    <>
      <div className="form-row">
        <div className="form-group">
          <label>เลขที่</label>
          <input className="field" value={payload.docNum} onChange={(e) => update("docNum", e.target.value)} />
        </div>
        <div className="form-group">
          <label>ให้ไว้ ณ วันที่</label>
          <input className="field" type="date" value={payload.date} onChange={(e) => update("date", e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label>ส่วนราชการเจ้าของหนังสือ</label>
        <input className="field" value={payload.agencyName} onChange={(e) => update("agencyName", e.target.value)} />
      </div>
      <div className="form-group">
        <label>ที่ตั้ง</label>
        <textarea className="field" rows={2} value={payload.agencyAddress} onChange={(e) => update("agencyAddress", e.target.value)} />
      </div>
      <div className="form-group">
        <label>ผู้ได้รับการรับรอง</label>
        <input
          className="field"
          value={payload.certifiedName}
          onChange={(e) => update("certifiedName", e.target.value)}
          placeholder="ชื่อบุคคล นิติบุคคล หรือหน่วยงาน"
        />
      </div>
      <div className="form-group">
        <label>ข้อความที่รับรอง (ต่อจาก “หนังสือฉบับนี้ให้ไว้เพื่อรับรองว่า…”)</label>
        <p className={bodyChars > DOC_SOFT_LIMITS.bodyTotal ? "char-budget-banner" : "char-count"}>
          รวม {bodyChars}/{DOC_SOFT_LIMITS.bodyTotal} ตัวอักษร
        </p>
        {payload.paragraphs.map((p, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <textarea
              className="field"
              rows={4}
              value={p}
              onChange={(e) => {
                const list = [...payload.paragraphs];
                list[i] = e.target.value;
                update("paragraphs", list);
              }}
            />
            {i > 0 ? (
              <button type="button" className="btn-text" onClick={() => update("paragraphs", payload.paragraphs.filter((_, j) => j !== i))}>
                ลบย่อหน้า
              </button>
            ) : null}
          </div>
        ))}
        <button type="button" className="btn-text" onClick={() => update("paragraphs", [...payload.paragraphs, ""])}>
          + เพิ่มย่อหน้า
        </button>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>ชื่อเต็มผู้ลงนาม</label>
          <input className="field" value={payload.signName} onChange={(e) => update("signName", e.target.value)} />
        </div>
        <div className="form-group">
          <label>ตำแหน่ง</label>
          <textarea className="field" rows={2} value={payload.position} onChange={(e) => update("position", e.target.value)} />
        </div>
      </div>
      <p className="text-sm text-[var(--text-muted)]">รูปถ่าย ๔×๖ ซม. แสดงเป็นกรอบว่าง — ยังไม่อัปโหลดรูป</p>
    </>
  );

  return (
    <OfficialEditorFrame
      title={title}
      typeLabel="ประเภท: หนังสือรับรอง (แบบที่ 10)"
      formTitle="กรอกข้อมูลหนังสือรับรอง"
      message={message}
      pending={pending}
      status={status}
      onStatus={(s) => {
        setStatus(s);
        markDirty();
      }}
      mobileTab={mobileTab}
      setMobileTab={setMobileTab}
      onSave={() =>
        startTransition(async () => {
          const ok = await persist();
          if (ok) router.refresh();
        })
      }
      onDuplicate={() =>
        startTransition(async () => {
          await persist({ silent: true });
          const result = await duplicateDocumentAction(documentId);
          if (!result.ok || !result.documentId) {
            setMessage(result.error ?? "คัดลอกไม่สำเร็จ");
            return;
          }
          router.push(`/documents/${result.documentId}`);
        })
      }
      onPdf={() =>
        startTransition(async () => {
          await persist({ silent: true });
          window.location.href = `/api/export/pdf?id=${documentId}`;
        })
      }
      onWord={async () => {
        await persist({ silent: true });
        window.location.href = `/api/export/docx?id=${documentId}`;
      }}
      zoomOpen={zoomOpen}
      setZoomOpen={setZoomOpen}
      form={form}
      preview={<CertLetterPreview data={payload} />}
      zoomPreview={<CertLetterPreview data={payload} printMode />}
    />
  );
}
