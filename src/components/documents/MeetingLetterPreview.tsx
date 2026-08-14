import type { MeetingLetterPayload } from "@/lib/documents/meeting/schema";
import { getThaiDate, toThaiNumber } from "@/lib/thai";

type Props = {
  data: MeetingLetterPayload;
  className?: string;
  printMode?: boolean;
};

function cleanList(items: string[]): string[] {
  return items.map((x) => toThaiNumber(x)).filter((x) => x.trim() !== "");
}

export function MeetingLetterPreview({ data, className = "", printMode }: Props) {
  const committee = toThaiNumber(data.committee);
  const session = toThaiNumber(data.session);
  const date = getThaiDate(data.date);
  const place = toThaiNumber(data.place);
  const attendees = cleanList(data.attendees || []);
  const absentees = cleanList(data.absentees || []);
  const participants = cleanList(data.participants || []);
  const startTime = toThaiNumber(data.startTime);
  const endTime = toThaiNumber(data.endTime);
  const recorder = toThaiNumber(data.recorderName);
  const agendas = (data.agendas || []).filter(
    (a) => a.title.trim() || a.body.trim() || a.resolution.trim(),
  );

  return (
    <article
      className={`doc-a4 doc-meeting font-sarabun text-black pt-[2cm] pr-[2cm] pb-[2cm] pl-[3cm] ${printMode ? "doc-a4-print" : "doc-a4-preview"} ${className}`}
    >
      <div className="doc-meeting-logo" aria-label="ที่โลโก้องค์กร">
        <span>โลโก้หน่วยงาน</span>
      </div>

      <div className="doc-official-heading text-center">รายงานการประชุม {committee}</div>
      <div className="text-center mt-[4pt]">ครั้งที่ {session}</div>
      <div className="text-center mt-[4pt]">เมื่อ {date}</div>
      <div className="text-center mt-[4pt]">ณ {place}</div>

      <div className="doc-meeting-rule" />

      <div className="mt-[6pt]">
        <strong>ผู้มาประชุม</strong>
        {attendees.length ? (
          <ol className="doc-meta-list">
            {attendees.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        ) : null}
      </div>
      {absentees.length ? (
        <div className="mt-[6pt]">
          <strong>ผู้ไม่มาประชุม</strong>
          <ol className="doc-meta-list">
            {absentees.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        </div>
      ) : null}
      {participants.length ? (
        <div className="mt-[6pt]">
          <strong>ผู้เข้าร่วมประชุม</strong>
          <ol className="doc-meta-list">
            {participants.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        </div>
      ) : null}

      <div className="mt-[6pt]">เริ่มประชุมเวลา {startTime || "…"} น.</div>

      {agendas.map((a, i) => (
        <div key={i} className="doc-meeting-agenda">
          <div>
            <strong>
              ระเบียบวาระที่ {toThaiNumber(i + 1)} {toThaiNumber(a.title)}
            </strong>
          </div>
          {a.body.trim() ? (
            <p className="doc-paragraph indent-[2.5cm]">{toThaiNumber(a.body)}</p>
          ) : null}
          {a.resolution.trim() ? (
            <p className="doc-paragraph indent-[2.5cm]">
              <strong>มติที่ประชุม</strong> {toThaiNumber(a.resolution)}
            </p>
          ) : null}
        </div>
      ))}

      <div className="mt-[6pt]">เลิกประชุมเวลา {endTime || "…"} น.</div>

      <div className="doc-stamp-block">
        <div className="doc-sign-space" aria-hidden="true" />
        {recorder ? <div className="doc-sign-name text-center">({recorder})</div> : null}
        <div className="doc-sign-position text-center">ผู้จดรายงานการประชุม</div>
      </div>
    </article>
  );
}
