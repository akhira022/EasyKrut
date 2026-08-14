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

function MetaRow({
  label,
  value,
  boldLabel = true,
  className = "",
}: {
  label: string;
  value: string;
  boldLabel?: boolean;
  className?: string;
}) {
  if (!value.trim()) return null;
  return (
    <div className={`doc-meta mt-[4pt] ${className}`.trim()}>
      <span className={`doc-meta-label ${boldLabel ? "font-bold" : "font-normal"}`}>{label}</span>
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
    return <MetaRow label={label} value={items[0]!} boldLabel={false} className={className} />;
  }
  return (
    <div className={`doc-meta doc-meta-stacked mt-[4pt] ${className}`.trim()}>
      <span className="doc-meta-label font-normal">{label}</span>
      <ol className="doc-meta-list">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ol>
    </div>
  );
}

/** ค่าที่ยังไม่กรอกแสดงเป็นจุดไข่ปลาเต็มช่อง ตามแบบฟอร์มบันทึกข้อความ */
function MemoValue({ value }: { value: string }) {
  if (!value.trim()) return <span className="doc-memo-dots" aria-hidden="true" />;
  return <span className="doc-meta-value">{value}</span>;
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
  const showAgencyRule = data.showAgencyRule ?? true;
  const showDocDateRule = data.showDocDateRule ?? true;

  return (
    <article
      className={`doc-a4 doc-memo font-sarabun text-black pt-[2cm] pr-[2cm] pb-[2cm] pl-[3cm] ${printMode ? "doc-a4-print" : "doc-a4-preview"} ${className}`}
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
        {/* Header fields always render so the form skeleton stays visible while editing.
            Ruled underlines match แบบบันทึกข้อความ (กระดาษแบบที่ 2). */}
        <div className={`doc-meta ${showAgencyRule ? "doc-memo-ruled" : ""}`.trim()}>
          <strong className="doc-memo-label">ส่วนราชการ</strong>
          <MemoValue value={agencyName} />
        </div>

        <div className={`doc-memo-meta-row ${showDocDateRule ? "doc-memo-ruled" : ""}`.trim()}>
          <span className="doc-memo-ruled-half">
            <strong className="doc-memo-label">ที่</strong>
            <MemoValue value={docnum} />
          </span>
          <span className="doc-memo-ruled-half">
            <strong className="doc-memo-label">วันที่</strong>
            <MemoValue value={date} />
          </span>
        </div>

        <div className="doc-meta doc-memo-separator">
          <strong className="doc-memo-label">เรื่อง</strong>
          <MemoValue value={subject} />
        </div>
      </div>

      <MetaRow label={data.salutation} value={receiver} boldLabel={false} />
      <MetaRow label="จาก" value={from} boldLabel={false} />
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
          <div key={i} className="doc-para-block">
            <p className="doc-paragraph indent-[2.5cm]">{p}</p>
          </div>
        ))}
        {data.closing.trim() ? (
          <div className="doc-para-block">
            <p className="doc-paragraph indent-[2.5cm]">{toThaiNumber(data.closing)}</p>
          </div>
        ) : null}
      </div>

      <div className="doc-closing-block">
        <div className="doc-signature ml-[50%] w-1/2 text-center mt-[12pt]">
          <div className="doc-sign-space" aria-hidden="true" />
          {signName || position ? (
            <div className="doc-sign-identity">
              {signName ? <div className="doc-sign-name text-center">({signName})</div> : null}
              {position ? (
                <div className="doc-sign-position text-center" style={{ whiteSpace: "pre-line" }}>
                  {position}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
