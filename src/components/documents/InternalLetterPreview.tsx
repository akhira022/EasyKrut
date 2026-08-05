import type { InternalLetterPayload } from "@/lib/documents/internal/schema";
import { getThaiDate, toThaiNumber } from "@/lib/thai";

type Props = {
  data: InternalLetterPayload;
  className?: string;
  printMode?: boolean;
};

function numberedItems(items: string[]): string[] {
  return items.map((x) => toThaiNumber(x)).filter((x) => x.trim() !== "");
}

export function InternalLetterPreview({ data, className = "", printMode }: Props) {
  const agencyName = toThaiNumber(data.agencyName);
  const docnum = toThaiNumber(data.docNum);
  const date = getThaiDate(data.date);
  const subject = toThaiNumber(data.subject);
  const receiver = toThaiNumber(data.receiver);
  const from = toThaiNumber(data.from);
  const references = numberedItems(data.references || []);
  const attachments = numberedItems(data.attachments || []);
  const signName = toThaiNumber(data.signName);
  const position = toThaiNumber(data.position);
  const paragraphs = (data.paragraphs || [])
    .map((p) => toThaiNumber(p).replace(/\s+/g, " ").trim())
    .filter((p) => p !== "");

  return (
    <article
      className={`doc-a4 doc-memo font-sarabun text-black ${printMode ? "doc-a4-print" : "doc-a4-preview"} ${className}`}
    >
      {data.urgency ? <div className="doc-urgency">{data.urgency}</div> : null}

      <div className="doc-memo-header">
        <div className="doc-memo-garuda">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/krut.png" alt="ตราครุฑ" />
        </div>
        <div className="doc-memo-title">บันทึกข้อความ</div>
      </div>

      <div className="doc-memo-meta">
        <div>
          <strong>ส่วนราชการ</strong>
          &nbsp;&nbsp;{agencyName}
        </div>
        <div className="doc-memo-meta-row">
          <span>
            <strong>ที่</strong>
            &nbsp;&nbsp;{docnum}
          </span>
          <span>
            <strong>วันที่</strong>
            &nbsp;&nbsp;{date}
          </span>
        </div>
        <div>
          <strong>เรื่อง</strong>
          &nbsp;&nbsp;{subject}
        </div>
      </div>

      <div className="doc-meta">
        <strong className="doc-meta-label">{data.salutation}</strong>
        <span className="doc-meta-value" style={{ whiteSpace: "pre-line" }}>
          {receiver}
        </span>
      </div>
      {from ? (
        <div className="doc-meta">
          <strong className="doc-meta-label">จาก</strong>
          <span className="doc-meta-value">{from}</span>
        </div>
      ) : null}
      {references.length === 1 ? (
        <div className="doc-meta">
          <strong className="doc-meta-label">อ้างถึง</strong>
          <span className="doc-meta-value">{references[0]}</span>
        </div>
      ) : null}
      {references.length > 1 ? (
        <div className="doc-meta doc-meta-stacked">
          <strong>อ้างถึง</strong>
          <ol className="doc-meta-list">
            {references.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        </div>
      ) : null}
      {attachments.length === 1 ? (
        <div className="doc-meta doc-meta-last">
          <strong className="doc-meta-label">สิ่งที่ส่งมาด้วย</strong>
          <span className="doc-meta-value">{attachments[0]}</span>
        </div>
      ) : null}
      {attachments.length > 1 ? (
        <div className="doc-meta doc-meta-stacked doc-meta-last">
          <strong>สิ่งที่ส่งมาด้วย</strong>
          <ol className="doc-meta-list">
            {attachments.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        </div>
      ) : null}

      <div className="doc-body">
        {paragraphs.map((p, i) => (
          <p key={i} className="doc-paragraph">
            {p}
          </p>
        ))}
      </div>

      <div className="doc-closing-block">
        <div className="doc-signature">
          <div className="doc-closing">{data.closing}</div>
          <div className="doc-sign-space" aria-hidden="true" />
          {signName ? <div className="doc-sign-name">({signName})</div> : null}
          {position ? (
            <div className="doc-sign-position" style={{ whiteSpace: "pre-line" }}>
              {position}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
