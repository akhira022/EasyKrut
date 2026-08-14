import { getThaiDate, toThaiNumber } from "@/lib/thai";

type Props = {
  urgency?: string;
  heading: string;
  docNum?: string;
  subject: string;
  paragraphs: string[];
  dateLabel: string;
  date: string;
  signName: string;
  position: string;
  className?: string;
  printMode?: boolean;
};

export function CenteredOfficialPreview({
  urgency,
  heading,
  docNum,
  subject,
  paragraphs,
  dateLabel,
  date,
  signName,
  position,
  className = "",
  printMode,
}: Props) {
  const headingText = toThaiNumber(heading);
  const num = toThaiNumber(docNum ?? "");
  const subjectText = toThaiNumber(subject);
  const dateText = getThaiDate(date);
  const sign = toThaiNumber(signName);
  const pos = toThaiNumber(position);
  const paras = (paragraphs || [])
    .map((p) => toThaiNumber(p).replace(/\s+/g, " ").trim())
    .filter((p) => p !== "");

  return (
    <article
      className={`doc-a4 doc-official-center font-sarabun text-black pt-[2.5cm] pr-[2cm] pb-[2cm] pl-[3cm] ${printMode ? "doc-a4-print" : "doc-a4-preview"} ${className}`}
    >
      {urgency ? <div className="doc-urgency">{urgency}</div> : null}
      <div className="doc-official-garuda">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/krut.png" alt="ตราครุฑ" />
      </div>
      <div className="doc-official-heading text-center">{headingText}</div>
      {docNum !== undefined ? (
        <div className="doc-official-line text-center mt-[6pt]">ที่ {num}</div>
      ) : null}
      <div className="doc-meta mt-[6pt] justify-center">
        <span className="doc-meta-label">เรื่อง</span>
        <span className="doc-meta-value">{subjectText}</span>
      </div>
      <div className="doc-body">
        {paras.map((p, i) => (
          <div key={i} className="doc-para-block">
            <p className="doc-paragraph indent-[2.5cm]">{p}</p>
          </div>
        ))}
      </div>
      <div className="doc-stamp-block">
        {dateText ? (
          <div className="text-center">
            {dateLabel} {dateText}
          </div>
        ) : null}
        <div className="doc-sign-space" aria-hidden="true" />
        {sign ? <div className="doc-sign-name text-center">({sign})</div> : null}
        {pos ? (
          <div className="doc-sign-position text-center" style={{ whiteSpace: "pre-line" }}>
            {pos}
          </div>
        ) : null}
      </div>
    </article>
  );
}
