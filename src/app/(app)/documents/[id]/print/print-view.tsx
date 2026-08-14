"use client";

import { ExternalLetterPreview } from "@/components/documents/ExternalLetterPreview";
import { InternalLetterPreview } from "@/components/documents/InternalLetterPreview";
import { StampLetterPreview } from "@/components/documents/StampLetterPreview";
import { DocumentType } from "@/lib/constants";
import type { ExternalLetterPayload } from "@/lib/documents/external/schema";
import type { InternalLetterPayload } from "@/lib/documents/internal/schema";
import type { StampLetterPayload } from "@/lib/documents/stamp/schema";

type Props = {
  documentId: string;
  title: string;
  type: string;
  externalData?: ExternalLetterPayload;
  internalData?: InternalLetterPayload;
  stampData?: StampLetterPayload;
};

export function PrintView({
  documentId,
  title,
  type,
  externalData,
  internalData,
  stampData,
}: Props) {
  function downloadPdf() {
    window.location.href = `/api/export/pdf?id=${documentId}`;
  }

  return (
    <div className="print-root bg-[#e8e8e8] min-h-screen py-6">
      <div className="flex justify-center gap-3 mb-4">
        <button type="button" className="btn-primary" onClick={downloadPdf}>
          ดาวน์โหลด PDF
        </button>
        <button type="button" className="btn-secondary" onClick={() => window.close()}>
          ปิด
        </button>
        <span className="self-center text-sm text-[var(--text-muted)]">{title}</span>
      </div>

      <div className="print-sheet flex justify-center">
        {type === DocumentType.INTERNAL && internalData ? (
          <InternalLetterPreview data={internalData} printMode />
        ) : null}
        {type === DocumentType.STAMP && stampData ? (
          <StampLetterPreview data={stampData} printMode />
        ) : null}
        {type === DocumentType.EXTERNAL && externalData ? (
          <ExternalLetterPreview data={externalData} printMode />
        ) : null}
      </div>
    </div>
  );
}
