import { AlignmentType, Paragraph, Packer, convertInchesToTwip } from "docx";
import type { MeetingLetterPayload } from "@/lib/documents/meeting/schema";
import { a4Section, run } from "@/lib/documents/official-docx";
import { getThaiDate, toThaiNumber } from "@/lib/thai";

function listBlock(label: string, items: string[]): Paragraph[] {
  const cleaned = items.map((x) => toThaiNumber(x)).filter((x) => x.trim());
  if (cleaned.length === 0) return [];
  const out: Paragraph[] = [
    new Paragraph({ spacing: { before: 120, after: 40 }, children: [run(label, { bold: true })] }),
  ];
  cleaned.forEach((item, i) => {
    out.push(
      new Paragraph({
        indent: { left: convertInchesToTwip(0.4) },
        children: [run(`${toThaiNumber(i + 1)}. ${item}`)],
      }),
    );
  });
  return out;
}

export async function buildMeetingDocx(data: MeetingLetterPayload): Promise<Buffer> {
  const committee = toThaiNumber(data.committee);
  const session = toThaiNumber(data.session);
  const date = getThaiDate(data.date);
  const place = toThaiNumber(data.place);
  const recorder = toThaiNumber(data.recorderName);
  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [run("(โลโก้หน่วยงาน)", { color: "999999", size: 20 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [run(`รายงานการประชุม ${committee}`, { bold: true, size: 36 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [run(`ครั้งที่ ${session}`)],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [run(`เมื่อ ${date}`)],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [run(`ณ ${place}`)],
    }),
  ];

  children.push(...listBlock("ผู้มาประชุม", data.attendees || []));
  children.push(...listBlock("ผู้ไม่มาประชุม", data.absentees || []));
  children.push(...listBlock("ผู้เข้าร่วมประชุม", data.participants || []));

  children.push(
    new Paragraph({
      spacing: { before: 120, after: 80 },
      children: [run(`เริ่มประชุมเวลา ${toThaiNumber(data.startTime) || "…"} น.`)],
    }),
  );

  (data.agendas || [])
    .filter((a) => a.title.trim() || a.body.trim() || a.resolution.trim())
    .forEach((a, i) => {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          children: [
            run(`ระเบียบวาระที่ ${toThaiNumber(i + 1)} ${toThaiNumber(a.title)}`, { bold: true }),
          ],
        }),
      );
      if (a.body.trim()) {
        children.push(
          new Paragraph({
            indent: { firstLine: convertInchesToTwip(0.98) },
            alignment: AlignmentType.THAI_DISTRIBUTE,
            children: [run(toThaiNumber(a.body))],
          }),
        );
      }
      if (a.resolution.trim()) {
        children.push(
          new Paragraph({
            indent: { firstLine: convertInchesToTwip(0.98) },
            children: [run("มติที่ประชุม  ", { bold: true }), run(toThaiNumber(a.resolution))],
          }),
        );
      }
    });

  children.push(
    new Paragraph({
      spacing: { before: 120, after: 200 },
      children: [run(`เลิกประชุมเวลา ${toThaiNumber(data.endTime) || "…"} น.`)],
    }),
  );
  if (recorder) {
    children.push(
      new Paragraph({
        indent: { left: convertInchesToTwip(3.15) },
        alignment: AlignmentType.CENTER,
        children: [run(`(${recorder})`)],
      }),
    );
  }
  children.push(
    new Paragraph({
      indent: { left: convertInchesToTwip(3.15) },
      alignment: AlignmentType.CENTER,
      children: [run("ผู้จดรายงานการประชุม")],
    }),
  );

  return Buffer.from(await Packer.toBuffer(a4Section(children)));
}
