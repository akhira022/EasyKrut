import type { StampLetterPayload } from "@/lib/documents/stamp/schema";
import { getThaiDate, toThaiNumber } from "@/lib/thai";

type Props = {
  data: StampLetterPayload;
  className?: string;
  printMode?: boolean;
};

function AgencyLines({ text, className = "" }: { text: string; className?: string }) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;
  return (
    <div className={className || undefined}>
      {lines.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  );
}

export function StampLetterPreview({ data, className = "", printMode }: Props) {
  const docnum = toThaiNumber(data.docNum);
  const to = toThaiNumber(data.to);
  const date = getThaiDate(data.date);
  const senderAgency = toThaiNumber(data.senderAgency);
  const initials = toThaiNumber(data.initials);
  const contactUnit = toThaiNumber(data.contactUnit);
  const tel = toThaiNumber(data.tel);
  const address = toThaiNumber(data.address);
  const paragraphs = (data.paragraphs || [])
    .map((p) => toThaiNumber(p).replace(/\s+/g, " ").trim())
    .filter((p) => p !== "");

  return (
    <article
      className={`doc-a4 doc-stamp font-sarabun text-black pt-[2.5cm] pr-[2cm] pb-[2cm] pl-[3cm] ${printMode ? "doc-a4-print" : "doc-a4-preview"} ${className}`}
    >
      <div className="doc-stamp-header">
        {data.urgency ? <div className="doc-urgency">{data.urgency}</div> : null}
        <div className="doc-stamp-garuda">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/krut.png" alt="ตราครุฑ" />
        </div>
      </div>

      <div className="doc-docnum mt-[6pt]">ที่ {docnum}</div>

      <div className="doc-meta mt-[6pt]">
        <span className="doc-meta-label font-normal">ถึง</span>
        <span className="doc-meta-value">{to}</span>
      </div>

      <div className="doc-body">
        {paragraphs.map((p, i) => (
          <div key={i} className="doc-para-block">
            <p className="doc-paragraph indent-[2.5cm]">{p}</p>
          </div>
        ))}
      </div>

      <div className="doc-stamp-block">
        {senderAgency ? (
          <div className="doc-stamp-sender text-center">{senderAgency}</div>
        ) : null}
        <div className="doc-stamp-seal" aria-label="ตราชื่อส่วนราชการ">
          <span className="doc-stamp-seal-label">ตราชื่อส่วนราชการ</span>
        </div>
        {initials ? <div className="doc-stamp-initials text-center">{initials}</div> : null}
        {date ? <div className="doc-stamp-date text-center">{date}</div> : null}
      </div>

      <div className="doc-stamp-contact">
        {contactUnit ? <div>{contactUnit}</div> : null}
        {tel ? <div>โทร. {tel}</div> : null}
        <AgencyLines text={address} />
      </div>
    </article>
  );
}
