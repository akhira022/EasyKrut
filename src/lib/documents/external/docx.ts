import {
  AlignmentType,
  Document,
  ImageRun,
  LineRuleType,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
  convertInchesToTwip,
  BorderStyle,
} from "docx";
import { readFile } from "fs/promises";
import path from "path";
import type { ExternalLetterPayload } from "@/lib/documents/external/schema";
import { getThaiDate, toThaiNumber } from "@/lib/thai";

const FONT = "TH SarabunPSK";
const SIZE = 32; // 16pt
const NO_BORDER = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

function run(text: string, opts?: { bold?: boolean; color?: string; size?: number }) {
  return new TextRun({
    text,
    font: FONT,
    size: opts?.size ?? SIZE,
    bold: opts?.bold,
    color: opts?.color,
  });
}

function p(text: string) {
  return new Paragraph({
    spacing: { after: 60 },
    children: [run(text)],
  });
}

/** 1 Enter + Before 6 pt ≈ single line + 120 twip */
const META_SPACING = { after: 120, line: 276, lineRule: LineRuleType.AUTO };

function richLabel(label: string, value: string) {
  return new Paragraph({
    spacing: META_SPACING,
    children: [run(label), run(`  ${value}`)],
  });
}

function listLabel(label: string, items: string[]): Paragraph[] {
  const cleaned = items.map((x) => toThaiNumber(x)).filter((x) => x.trim());
  if (cleaned.length === 0) return [];
  if (cleaned.length === 1) return [richLabel(label, cleaned[0]!)];
  const out: Paragraph[] = [
    new Paragraph({
      spacing: { after: 40, line: 276, lineRule: LineRuleType.AUTO },
      children: [run(label)],
    }),
  ];
  cleaned.forEach((item, i) => {
    out.push(
      new Paragraph({
        spacing: i === cleaned.length - 1 ? META_SPACING : { after: 40, line: 276, lineRule: LineRuleType.AUTO },
        indent: { left: convertInchesToTwip(0.4) },
        children: [run(`${toThaiNumber(i + 1)}. ${item}`)],
      }),
    );
  });
  return out;
}

function agencyLines(text: string, opts?: { firstSpacingBefore?: number }): Paragraph[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    return [new Paragraph({ children: [run("")] })];
  }
  return lines.map(
    (line, i) =>
      new Paragraph({
        spacing: {
          before: i === 0 ? (opts?.firstSpacingBefore ?? 0) : 120,
          after: i === lines.length - 1 ? 0 : 0,
          line: 276,
          lineRule: LineRuleType.AUTO,
        },
        children: [run(line)],
      }),
  );
}

export async function buildExternalDocx(data: ExternalLetterPayload): Promise<Buffer> {
  const agencyName = toThaiNumber(data.agencyName);
  const agencyAddress = toThaiNumber(data.agencyAddress);
  const docnum = toThaiNumber(data.docNum);
  const date = getThaiDate(data.date);
  const subject = toThaiNumber(data.subject);
  const receiver = toThaiNumber(data.receiver);
  const signName = toThaiNumber(data.signName);
  const position = toThaiNumber(data.position);
  const contactUnit = toThaiNumber(data.contactUnit);
  const tel = toThaiNumber(data.tel);
  const fax = toThaiNumber(data.fax);
  const cc = toThaiNumber(data.cc);
  const paragraphs = (data.paragraphs || [])
    .map((x) => toThaiNumber(x).replace(/\s+/g, " ").trim())
    .filter((x) => x);

  let garuda: ImageRun | null = null;
  try {
    const imgPath = path.join(process.cwd(), "public", "krut.png");
    const buf = await readFile(imgPath);
    garuda = new ImageRun({
      type: "png",
      data: buf,
      // สูง 3 ซม. ตามแบบ (≈113px @96dpi)
      transformation: { width: 113, height: 113 },
      altText: { title: "ครุฑ", description: "ตราครุฑ", name: "krut" },
    });
  } catch {
    garuda = null;
  }

  const children: (Paragraph | Table)[] = [];

  if (data.urgency) {
    children.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [run(data.urgency, { bold: true, color: "CC0000", size: 48 })],
      }),
    );
  }

  // ตามรูปแบบ_หนังสือภายนอก.pdf: ที่ | ครุฑกึ่งกลาง | ส่วนราชการ (เริ่มแกนหน้า, ระดับเท้า)
  const contentW = convertInchesToTwip(16 / 2.54);
  const axis = convertInchesToTwip(8 / 2.54); // 50% ของความกว้างเนื้อหา 16 ซม.
  const midCol = convertInchesToTwip(3 / 2.54);
  const leftCol = axis - midCol / 2;
  const rightCol = contentW - leftCol - midCol;
  const nameParas = agencyLines(agencyName);
  const addrParas = agencyAddress.trim()
    ? agencyLines(agencyAddress, { firstSpacingBefore: 120 })
    : [];
  const rightParas = [...nameParas, ...addrParas];
  if (rightParas.length === 0) {
    rightParas.push(new Paragraph({ children: [run("")] }));
  }

  children.push(
    new Table({
      width: { size: contentW, type: WidthType.DXA },
      columnWidths: [leftCol, midCol, rightCol],
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: NO_BORDER,
              width: { size: leftCol, type: WidthType.DXA },
              verticalAlign: VerticalAlign.BOTTOM,
              children: [
                new Paragraph({
                  spacing: { after: 0 },
                  children: [run(`ที่ ${docnum}`)],
                }),
              ],
            }),
            new TableCell({
              borders: NO_BORDER,
              width: { size: midCol, type: WidthType.DXA },
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 0 },
                  children: garuda ? [garuda] : [run("")],
                }),
              ],
            }),
            new TableCell({
              borders: NO_BORDER,
              width: { size: rightCol, type: WidthType.DXA },
              verticalAlign: VerticalAlign.BOTTOM,
              children: rightParas,
            }),
          ],
        }),
      ],
    }),
  );

  if (date) {
    children.push(
      new Paragraph({
        spacing: { before: 120, after: 120, line: 276, lineRule: LineRuleType.AUTO },
        indent: { left: axis },
        children: [run(date)],
      }),
    );
  }

  if (subject) children.push(richLabel("เรื่อง", subject));
  if (receiver) {
    const receiverLines = receiver
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (receiverLines.length <= 1) {
      children.push(richLabel(data.salutation, receiverLines[0] || ""));
    } else {
      children.push(richLabel(data.salutation, receiverLines[0]!));
      receiverLines.slice(1).forEach((line) => {
        children.push(
          new Paragraph({
            spacing: { after: 60 },
            indent: { left: convertInchesToTwip(0.7) },
            children: [run(line)],
          }),
        );
      });
    }
  }
  children.push(...listLabel("อ้างถึง", data.references || []));
  children.push(...listLabel("สิ่งที่ส่งมาด้วย", data.attachments || []));

  for (const para of paragraphs) {
    children.push(
      new Paragraph({
        // ย่อหน้า 2.5 ซม. + 1 Enter + Before 6 pt ระหว่างย่อหน้า
        spacing: { after: 120, line: 276, lineRule: LineRuleType.AUTO },
        indent: { firstLine: convertInchesToTwip(2.5 / 2.54) },
        alignment: AlignmentType.THAI_DISTRIBUTE,
        children: [run(para)],
      }),
    );
  }

  const halfPage = axis; // กึ่งกลางหน้า = 7.5 ซม.
  children.push(
    new Paragraph({
      indent: { left: halfPage },
      // 1 Enter + Before 12 pt จากภาคสรุป
      spacing: { before: 240, after: 0, line: 276, lineRule: LineRuleType.AUTO },
      children: [run(data.closing)],
    }),
  );
  // [10] เว้นลายเซ็น ~4 Enter
  for (let i = 0; i < 4; i++) {
    children.push(
      new Paragraph({
        indent: { left: halfPage },
        spacing: { after: 0, line: 276, lineRule: LineRuleType.AUTO },
        children: [run(" ")],
      }),
    );
  }
  if (signName) {
    children.push(
      new Paragraph({
        indent: { left: halfPage },
        alignment: AlignmentType.CENTER,
        spacing: { after: 40, line: 276, lineRule: LineRuleType.AUTO },
        children: [run(`(${signName})`)],
      }),
    );
  }
  if (position) {
    position
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((line) => {
        children.push(
          new Paragraph({
            indent: { left: halfPage },
            alignment: AlignmentType.CENTER,
            spacing: { after: 20, line: 276, lineRule: LineRuleType.AUTO },
            children: [run(line)],
          }),
        );
      });
  }

  // [13–16] ~4 Enter จากตำแหน่ง ถึงส่วนราชการเจ้าของเรื่อง
  for (let i = 0; i < 4; i++) {
    children.push(
      new Paragraph({
        spacing: { after: 0, line: 276, lineRule: LineRuleType.AUTO },
        children: [],
      }),
    );
  }
  if (contactUnit) children.push(p(contactUnit));
  if (tel) children.push(p(`โทร. ${tel}`));
  if (fax) children.push(p(`โทรสาร ${fax}`));
  if (data.email) children.push(p(`ไปรษณีย์อิเล็กทรอนิกส์ ${data.email}`));
  if (cc) {
    children.push(
      new Paragraph({
        spacing: { before: 120, after: 60 },
        children: [run("สำเนาส่ง", { bold: true }), run(`  ${cc}`)],
      }),
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: convertInchesToTwip(8.27),
              height: convertInchesToTwip(11.69),
            },
            margin: {
              // บน 2.5 / ซ้าย 3 / ขวา 2 / ล่าง 2 ซม.
              top: convertInchesToTwip(2.5 / 2.54),
              left: convertInchesToTwip(3 / 2.54),
              right: convertInchesToTwip(2 / 2.54),
              bottom: convertInchesToTwip(2 / 2.54),
            },
          },
        },
        children,
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
