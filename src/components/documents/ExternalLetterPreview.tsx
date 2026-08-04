import type { ExternalLetterPayload } from "@/lib/documents/external/schema";
import { getThaiDate, toThaiNumber } from "@/lib/thai";

type Props = {
  data: ExternalLetterPayload;
  className?: string;
  /** Use larger real-size A4 styles when true */
  printMode?: boolean;
};

export function ExternalLetterPreview({ data, className = "", printMode }: Props) {
  const dept = toThaiNumber(data.department);
  const docnum = toThaiNumber(data.docNum);
  const date = getThaiDate(data.date);
  const subject = toThaiNumber(data.subject);
  const receiver = toThaiNumber(data.receiver);
  const attachment = toThaiNumber(data.attachment);
  const reference = toThaiNumber(data.reference);
  const signName = toThaiNumber(data.signName);
  const position = toThaiNumber(data.position);
  const tel = toThaiNumber(data.tel);
  const fax = toThaiNumber(data.fax);
  const paragraphs = (data.paragraphs || [])
    .map((p) => toThaiNumber(p))
    .filter((p) => p.trim() !== "");

  return (
    <article
      className={`doc-a4 font-sarabun text-black ${printMode ? "doc-a4-print" : "doc-a4-preview"} ${className}`}
    >
      <div className="doc-header">
        <div className="doc-header-side doc-header-left">ที่ {docnum}</div>
        <div className="doc-header-garuda">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/krut.png" alt="ตราครุฑ" />
        </div>
        <div className="doc-header-side doc-header-right">{dept}</div>
      </div>

      {date ? <div className="doc-date">{date}</div> : null}

      {subject ? (
        <div className="doc-meta">
          <strong>เรื่อง</strong>
          &nbsp;&nbsp;{subject}
        </div>
      ) : null}
      {receiver ? (
        <div className="doc-meta">
          <strong>{data.salutation}</strong>
          &nbsp;&nbsp;{receiver}
        </div>
      ) : null}
      {reference ? (
        <div className="doc-meta">
          <strong>อ้างถึง</strong>
          &nbsp;&nbsp;{reference}
        </div>
      ) : null}
      {attachment ? (
        <div className="doc-meta doc-meta-last">
          <strong>สิ่งที่ส่งมาด้วย</strong>
          &nbsp;&nbsp;{attachment}
        </div>
      ) : null}

      <div className="doc-body">
        {paragraphs.map((p, i) => (
          <p key={i} className="doc-paragraph">
            {p}
          </p>
        ))}
      </div>

      <div className="doc-signature">
        <div className="doc-closing">{data.closing}</div>
        <div className="doc-sign-line">(ลงชื่อ).......................................................</div>
        {signName ? <div>{signName}</div> : null}
        {position ? <div>{position}</div> : null}
      </div>

      <div className="doc-contact">
        {dept ? <div>{dept.split(" ")[0]}</div> : null}
        {tel ? <div>โทร. {tel}</div> : null}
        {fax ? <div>โทรสาร {fax}</div> : null}
        {data.email ? <div>ไปรษณีย์อิเล็กทรอนิกส์ {data.email}</div> : null}
      </div>
    </article>
  );
}
