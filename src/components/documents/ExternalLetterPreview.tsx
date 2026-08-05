import type { ExternalLetterPayload } from "@/lib/documents/external/schema";
import { getThaiDate, toThaiNumber } from "@/lib/thai";

type Props = {
  data: ExternalLetterPayload;
  className?: string;
  /** Use larger real-size A4 styles when true */
  printMode?: boolean;
};

function numberedItems(items: string[]): string[] {
  return items.map((x) => toThaiNumber(x)).filter((x) => x.trim() !== "");
}

function MetaRow({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  if (!value.trim()) return null;
  return (
    <div className={`doc-meta ${className}`.trim()}>
      <strong className="doc-meta-label">{label}</strong>
      <span className="doc-meta-value">{value}</span>
    </div>
  );
}

function MetaList({
  label,
  items,
  className = "",
}: {
  label: string;
  items: string[];
  className?: string;
}) {
  if (items.length === 0) return null;
  if (items.length === 1) {
    return <MetaRow label={label} value={items[0]!} className={className} />;
  }
  return (
    <div className={`doc-meta doc-meta-stacked ${className}`.trim()}>
      <strong className="doc-meta-label">{label}</strong>
      <ol className="doc-meta-list">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ol>
    </div>
  );
}

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

export function ExternalLetterPreview({ data, className = "", printMode }: Props) {
  const agencyName = toThaiNumber(data.agencyName);
  const agencyAddress = toThaiNumber(data.agencyAddress);
  const docnum = toThaiNumber(data.docNum);
  const date = getThaiDate(data.date);
  const subject = toThaiNumber(data.subject);
  const receiver = toThaiNumber(data.receiver);
  const references = numberedItems(data.references || []);
  const attachments = numberedItems(data.attachments || []);
  const signName = toThaiNumber(data.signName);
  const position = toThaiNumber(data.position);
  const contactUnit = toThaiNumber(data.contactUnit);
  const tel = toThaiNumber(data.tel);
  const fax = toThaiNumber(data.fax);
  const cc = toThaiNumber(data.cc);
  const paragraphs = (data.paragraphs || [])
    .map((p) => toThaiNumber(p).replace(/\s+/g, " ").trim())
    .filter((p) => p !== "");

  return (
    <article
      className={`doc-a4 font-sarabun text-black ${printMode ? "doc-a4-print" : "doc-a4-preview"} ${className}`}
    >
      {data.urgency ? (
        <div className="doc-urgency">{data.urgency}</div>
      ) : null}

      <div className="doc-header">
        <div className="doc-header-left">ที่ {docnum}</div>
        <div className="doc-header-garuda">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/krut.png" alt="ตราครุฑ" />
        </div>
        <div className="doc-header-right">
          <AgencyLines text={agencyName} />
          <AgencyLines text={agencyAddress} className="doc-agency-address" />
        </div>
      </div>

      {date ? <div className="doc-date">{date}</div> : null}

      <MetaRow label="เรื่อง" value={subject} />
      <MetaRow label={data.salutation} value={receiver} />
      <MetaList
        label="อ้างถึง"
        items={references}
        className={!attachments.length && references.length ? "doc-meta-last" : undefined}
      />
      <MetaList
        label="สิ่งที่ส่งมาด้วย"
        items={attachments}
        className={attachments.length ? "doc-meta-last" : undefined}
      />

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
          {position ? <div className="doc-sign-position">{position}</div> : null}
        </div>

        <div className="doc-contact">
          {contactUnit ? <div>{contactUnit}</div> : null}
          {tel ? <div>โทร. {tel}</div> : null}
          {fax ? <div>โทรสาร {fax}</div> : null}
          {data.email ? <div>ไปรษณีย์อิเล็กทรอนิกส์ {data.email}</div> : null}
          {cc ? (
            <div className="doc-cc doc-meta">
              <strong className="doc-meta-label">สำเนาส่ง</strong>
              <span className="doc-meta-value">{cc}</span>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
