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

function richLabel(label: string, value: string) {
  return new Paragraph({
    spacing: { after: 80 },
    children: [run(label, { bold: true }), run(`  ${value}`)],
  });
}

function listLabel(label: string, items: string[]): Paragraph[] {
  const cleaned = items.map((x) => toThaiNumber(x)).filter((x) => x.trim());
  if (cleaned.length === 0) return [];
  if (cleaned.length === 1) return [richLabel(label, cleaned[0]!)];
  const out: Paragraph[] = [
    new Paragraph({
      spacing: { after: 40 },
      children: [run(label, { bold: true })],
    }),
  ];
  cleaned.forEach((item, i) => {
    out.push(
      new Paragraph({
        spacing: { after: 40 },
        indent: { left: convertInchesToTwip(0.4) },
        children: [run(`${toThaiNumber(i + 1)}. ${item}`)],
      }),
    );
  });
  return out;
}

function agencyLines(text: string): Paragraph[] {
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
        spacing: { after: i === lines.length - 1 ? 0 : 20 },
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
      // ~2.7cm — กะทัดรัดขึ้นเพื่ออยู่หน้าเดียว
      transformation: { width: 102, height: 102 },
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

  // ตาม 1703073586: ที่ | ครุฑ | ส่วนราชการ (ชิดซ้ายในคอลัมน์ขวา)
  // คอลัมน์ขวาแคบลงเพื่อให้ขอบซ้ายส่วนราชการอยู่ ~65% ของความกว้างเนื้อหา
  const contentW = convertInchesToTwip(6.3);
  const leftCol = convertInchesToTwip(2.0);
  const midCol = convertInchesToTwip(2.1);
  const rightCol = contentW - leftCol - midCol;
  const rightParas = [...agencyLines(agencyName), ...agencyLines(agencyAddress)];
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
              verticalAlign: VerticalAlign.CENTER,
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
        spacing: { before: 120, after: 120 },
        indent: { left: convertInchesToTwip(3.15) },
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
        spacing: { after: 100, line: 276, lineRule: LineRuleType.AUTO }, // ~1.15 line
        indent: { firstLine: convertInchesToTwip(0.98) }, // 2.5cm
        // จัดไทยกระจาย — ชิดซ้าย-ขวาโดยไม่ทำช่องว่างกว้างแบบ BOTH
        alignment: AlignmentType.THAI_DISTRIBUTE,
        children: [run(para)],
      }),
    );
  }

  children.push(
    new Paragraph({
      indent: { left: convertInchesToTwip(3.15) },
      spacing: { before: 120, after: 80 },
      children: [run(data.closing)],
    }),
  );
  children.push(
    new Paragraph({
      indent: { left: convertInchesToTwip(3.15) },
      spacing: { after: 200 },
      children: [run(" ")],
    }),
  );
  if (signName) {
    children.push(
      new Paragraph({
        indent: { left: convertInchesToTwip(3.15) },
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
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
            indent: { left: convertInchesToTwip(3.15) },
            alignment: AlignmentType.CENTER,
            spacing: { after: 20 },
            children: [run(line)],
          }),
        );
      });
  }

  children.push(new Paragraph({ spacing: { before: 160 }, children: [] }));
  if (contactUnit) children.push(p(contactUnit));
  if (tel) children.push(p(`โทร. ${tel}`));
  if (fax) children.push(p(`โทรสาร ${fax}`));
  if (data.email) children.push(p(`ไปรษณีย์อิเล็กทรอนิกส์ ${data.email}`));
  if (cc) {
    children.push(
      new Paragraph({
        spacing: { before: 100, after: 60 },
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
              top: convertInchesToTwip(1.18),
              left: convertInchesToTwip(1.18),
              right: convertInchesToTwip(0.79),
              bottom: convertInchesToTwip(0.79),
            },
          },
        },
        children,
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
