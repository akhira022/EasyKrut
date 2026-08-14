import type { CertLetterPayload } from "@/lib/documents/cert/schema";
import { getThaiDate, toThaiNumber } from "@/lib/thai";

type Props = {
  data: CertLetterPayload;
  className?: string;
  printMode?: boolean;
};

export function CertLetterPreview({ data, className = "", printMode }: Props) {
  const docnum = toThaiNumber(data.docNum);
  const agencyName = toThaiNumber(data.agencyName);
  const agencyAddress = toThaiNumber(data.agencyAddress);
  const certifiedName = toThaiNumber(data.certifiedName);
  const date = getThaiDate(data.date);
  const signName = toThaiNumber(data.signName);
  const position = toThaiNumber(data.position);
  const paragraphs = (data.paragraphs || [])
    .map((p) => toThaiNumber(p).replace(/\s+/g, " ").trim())
    .filter((p) => p !== "");

  return (
    <article
      className={`doc-a4 doc-cert font-sarabun text-black pt-[2.5cm] pr-[2cm] pb-[2cm] pl-[3cm] ${printMode ? "doc-a4-print" : "doc-a4-preview"} ${className}`}
    >
      <div className="doc-official-garuda">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/krut.png" alt="ตราครุฑ" />
      </div>

      <div className="doc-cert-top">
        <div>ที่ {docnum}</div>
        <div className="doc-cert-agency">
          <div>{agencyName}</div>
          {agencyAddress
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter(Boolean)
            .map((line, i) => (
              <div key={i}>{line}</div>
            ))}
        </div>
      </div>

      <p className="doc-paragraph indent-[2.5cm] mt-[12pt]">
        หนังสือฉบับนี้ให้ไว้เพื่อรับรองว่า {certifiedName}
        {paragraphs[0] ? ` ${paragraphs[0]}` : ""}
      </p>
      {paragraphs.slice(1).map((p, i) => (
        <p key={i} className="doc-paragraph indent-[2.5cm]">
          {p}
        </p>
      ))}

      <div className="doc-cert-bottom">
        <div className="doc-cert-photo" aria-label="ที่ติดรูปถ่าย">
          <span>รูปถ่าย ๔×๖ ซม.</span>
        </div>
        <div className="doc-stamp-block" style={{ marginLeft: 0, width: "auto" }}>
          {date ? <div className="text-center">ให้ไว้ ณ วันที่ {date}</div> : null}
          <div className="doc-sign-space" aria-hidden="true" />
          {signName ? <div className="doc-sign-name text-center">({signName})</div> : null}
          {position ? (
            <div className="doc-sign-position text-center" style={{ whiteSpace: "pre-line" }}>
              {position}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
