"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MeetingLetterPayload } from "@/lib/documents/meeting/schema";
import { MeetingLetterPreview } from "@/components/documents/MeetingLetterPreview";
import { OfficialEditorFrame } from "@/components/editor/OfficialEditorFrame";
import { useDocumentPersistence } from "@/components/editor/useDocumentPersistence";
import { duplicateDocumentAction, saveMeetingDocumentAction } from "@/lib/actions/documents";

type Props = {
  documentId: string;
  initialStatus: "DRAFT" | "FINAL";
  initialPayload: MeetingLetterPayload;
};

function listField(
  label: string,
  items: string[],
  onChange: (next: string[]) => void,
) {
  return (
    <div className="form-group">
      <label>{label}</label>
      {items.map((item, i) => (
        <div key={i} className="list-field-row">
          <input
            className="field"
            value={item}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
          />
          {items.length > 1 ? (
            <button
              type="button"
              className="btn-text"
              onClick={() => {
                const ok = window.confirm("ต้องการลบรายการนี้หรือไม่?");
                if (!ok) return;
                onChange(items.filter((_, j) => j !== i));
              }}
            >
              ลบ
            </button>
          ) : null}
        </div>
      ))}
      <button type="button" className="btn-text" onClick={() => onChange([...items, ""])}>
        + เพิ่ม
      </button>
    </div>
  );
}

export function MeetingEditor({ documentId, initialStatus, initialPayload }: Props) {
  const router = useRouter();
  const [payload, setPayload] = useState(initialPayload);
  const [status, setStatus] = useState<"DRAFT" | "FINAL">(initialStatus);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"form" | "preview">("form");
  const [pending, startTransition] = useTransition();
  const { persist, markDirty, persistStatus, message, messageTone, setMessage } =
    useDocumentPersistence(() =>
      saveMeetingDocumentAction({ id: documentId, status, payload }),
    );

  const title = useMemo(() => {
    const c = payload.committee.trim();
    const s = payload.session.trim();
    if (c && s) return `รายงานการประชุม ${c} ครั้งที่ ${s}`;
    if (c) return `รายงานการประชุม ${c}`;
    return "รายงานการประชุม";
  }, [payload.committee, payload.session]);

  function update<K extends keyof MeetingLetterPayload>(key: K, value: MeetingLetterPayload[K]) {
    setPayload((prev) => ({ ...prev, [key]: value }));
    markDirty();
  }

  const form = (
    <>
      <p className="text-sm text-[var(--text-muted)]">
        ไม่ใช้ตราครุฑ — เว้นกรอบโลโก้ว่างไว้ก่อน (อัปโหลดโลโก้องค์กรทีหลัง)
      </p>
      <div className="form-group">
        <label>รายงานการประชุม (ชื่อคณะหรือชื่อการประชุม)</label>
        <input className="field" value={payload.committee} onChange={(e) => update("committee", e.target.value)} />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>ครั้งที่</label>
          <input className="field" value={payload.session} onChange={(e) => update("session", e.target.value)} placeholder="เช่น ๑/๒๕๖๙" />
        </div>
        <div className="form-group">
          <label>เมื่อ</label>
          <input className="field" type="date" value={payload.date} onChange={(e) => update("date", e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label>ณ (สถานที่ประชุม)</label>
        <input className="field" value={payload.place} onChange={(e) => update("place", e.target.value)} />
      </div>
      {listField("ผู้มาประชุม", payload.attendees, (next) => update("attendees", next))}
      {listField("ผู้ไม่มาประชุม", payload.absentees, (next) => update("absentees", next))}
      {listField("ผู้เข้าร่วมประชุม", payload.participants, (next) => update("participants", next))}
      <div className="form-row">
        <div className="form-group">
          <label>เริ่มประชุมเวลา</label>
          <input className="field" value={payload.startTime} onChange={(e) => update("startTime", e.target.value)} placeholder="๐๙.๐๐" />
        </div>
        <div className="form-group">
          <label>เลิกประชุมเวลา</label>
          <input className="field" value={payload.endTime} onChange={(e) => update("endTime", e.target.value)} placeholder="๑๒.๐๐" />
        </div>
      </div>
      <div className="form-group">
        <label>ระเบียบวาระ</label>
        {payload.agendas.map((a, i) => (
          <div key={i} className="rounded-lg border border-[var(--border-color)] p-3 mb-3 space-y-2">
            <input
              className="field"
              value={a.title}
              placeholder={`ระเบียบวาระที่ ${i + 1} เรื่อง…`}
              onChange={(e) => {
                const next = [...payload.agendas];
                next[i] = { ...a, title: e.target.value };
                update("agendas", next);
              }}
            />
            <textarea
              className="field"
              rows={3}
              value={a.body}
              placeholder="ข้อความ"
              onChange={(e) => {
                const next = [...payload.agendas];
                next[i] = { ...a, body: e.target.value };
                update("agendas", next);
              }}
            />
            <textarea
              className="field"
              rows={2}
              value={a.resolution}
              placeholder="มติที่ประชุม"
              onChange={(e) => {
                const next = [...payload.agendas];
                next[i] = { ...a, resolution: e.target.value };
                update("agendas", next);
              }}
            />
            {i > 0 ? (
              <button
                type="button"
                className="btn-text"
                onClick={() => {
                  const ok = window.confirm(`ต้องการลบวาระ ${i + 1} หรือไม่?`);
                  if (!ok) return;
                  update("agendas", payload.agendas.filter((_, j) => j !== i));
                }}
              >
                ลบวาระ
              </button>
            ) : null}
          </div>
        ))}
        <button
          type="button"
          className="btn-text"
          onClick={() => update("agendas", [...payload.agendas, { title: "", body: "", resolution: "" }])}
        >
          + เพิ่มวาระ
        </button>
      </div>
      <div className="form-group">
        <label>ผู้จดรายงานการประชุม</label>
        <input className="field" value={payload.recorderName} onChange={(e) => update("recorderName", e.target.value)} />
      </div>
    </>
  );

  return (
    <OfficialEditorFrame
      title={title}
      typeLabel="ประเภท: รายงานการประชุม (แบบที่ 11)"
      formTitle="กรอกข้อมูลรายงานการประชุม"
      message={message}
      messageTone={messageTone}
      persistStatus={persistStatus}
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
          const ok = await persist({ silent: true });
          if (!ok) return;
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
          const ok = await persist({ silent: true });
          if (!ok) return;
          window.location.href = `/api/export/pdf?id=${documentId}`;
        })
      }
      onWord={() =>
        startTransition(async () => {
          const ok = await persist({ silent: true });
          if (!ok) return;
          window.location.href = `/api/export/docx?id=${documentId}`;
        })
      }
      zoomOpen={zoomOpen}
      setZoomOpen={setZoomOpen}
      form={form}
      preview={<MeetingLetterPreview data={payload} />}
      zoomPreview={<MeetingLetterPreview data={payload} printMode />}
    />
  );
}
