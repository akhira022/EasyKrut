"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Urgency } from "@/lib/documents/external/schema";
import type { AnnounceLetterPayload } from "@/lib/documents/announce/schema";
import {
  DOC_SOFT_LIMITS,
  bodyTotalChars,
  countChars,
  overSoftLimit,
} from "@/lib/documents/limits";
import { AnnounceLetterPreview } from "@/components/documents/AnnounceLetterPreview";
import { OfficialEditorFrame } from "@/components/editor/OfficialEditorFrame";
import { duplicateDocumentAction, saveAnnounceDocumentAction } from "@/lib/actions/documents";

type Props = {
  documentId: string;
  initialStatus: "DRAFT" | "FINAL";
  initialPayload: AnnounceLetterPayload;
};

export function AnnounceEditor({ documentId, initialStatus, initialPayload }: Props) {
  const router = useRouter();
  const [payload, setPayload] = useState(initialPayload);
  const [status, setStatus] = useState<"DRAFT" | "FINAL">(initialStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"form" | "preview">("form");
  const [pending, startTransition] = useTransition();
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);

  const title = useMemo(() => payload.subject.trim() || payload.kind, [payload.subject, payload.kind]);
  const bodyChars = useMemo(() => bodyTotalChars(payload.paragraphs), [payload.paragraphs]);

  function markDirty() {
    dirtyRef.current = true;
  }
  function update<K extends keyof AnnounceLetterPayload>(key: K, value: AnnounceLetterPayload[K]) {
    setPayload((prev) => ({ ...prev, [key]: value }));
    markDirty();
  }

  const persist = useEffectEvent(async (opts?: { silent?: boolean }) => {
    if (savingRef.current) return false;
    savingRef.current = true;
    try {
      const result = await saveAnnounceDocumentAction({ id: documentId, status, payload });
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
      <div className="form-group">
        <label>ชนิด</label>
        <select
          className="field"
          value={payload.kind}
          onChange={(e) => update("kind", e.target.value as AnnounceLetterPayload["kind"])}
        >
          <option value="ประกาศ">ประกาศ</option>
          <option value="แจ้งความ">แจ้งความ</option>
        </select>
      </div>
      <div className="form-group">
        <label>ชั้นความเร็ว</label>
        <select className="field" value={payload.urgency} onChange={(e) => update("urgency", e.target.value as Urgency)}>
          <option value="">ปกติ (ไม่ระบุ)</option>
          <option value="ด่วน">ด่วน</option>
          <option value="ด่วนมาก">ด่วนมาก</option>
          <option value="ด่วนที่สุด">ด่วนที่สุด</option>
        </select>
      </div>
      <div className="form-group">
        <label>{payload.kind} (ชื่อส่วนราชการที่ออก)</label>
        <input className="field" value={payload.issuer} onChange={(e) => update("issuer", e.target.value)} />
      </div>
      <div className="form-group">
        <label>เรื่อง</label>
        <input className="field" value={payload.subject} onChange={(e) => update("subject", e.target.value)} />
        <p className={`char-count ${overSoftLimit(payload.subject, DOC_SOFT_LIMITS.subject) ? "char-count-warn" : ""}`}>
          {countChars(payload.subject)}/{DOC_SOFT_LIMITS.subject}
        </p>
      </div>
      <div className="form-group">
        <label>{payload.kind} ณ วันที่</label>
        <input className="field" type="date" value={payload.date} onChange={(e) => update("date", e.target.value)} />
      </div>
      <div className="form-group">
        <label>ข้อความ</label>
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
    </>
  );

  return (
    <OfficialEditorFrame
      title={title}
      typeLabel={`ประเภท: ${payload.kind} (แบบที่ 7)`}
      formTitle={`กรอกข้อมูล${payload.kind}`}
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
      preview={<AnnounceLetterPreview data={payload} />}
      zoomPreview={<AnnounceLetterPreview data={payload} printMode />}
    />
  );
}
