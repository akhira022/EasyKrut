import {
  AlignmentType,
  Document,
  ImageRun,
  LineRuleType,
  Packer,
  Paragraph,
  TextRun,
  convertInchesToTwip,
} from "docx";
import { readFile } from "fs/promises";
import path from "path";
import type { InternalLetterPayload } from "@/lib/documents/internal/schema";
import { getThaiDate, toThaiNumber } from "@/lib/thai";

const FONT = "TH SarabunPSK";
const SIZE = 32;

function run(text: string, opts?: { bold?: boolean; color?: string; size?: number }) {
  return new TextRun({
    text,
    font: FONT,
    size: opts?.size ?? SIZE,
    bold: opts?.bold,
    color: opts?.color,
  });
}

function richLabel(label: string, value: string) {
  return new Paragraph({
    spacing: { after: 100 },
    children: [run(label, { bold: true }), run(`  ${value}`)],
  });
}

export async function buildInternalDocx(data: InternalLetterPayload): Promise<Buffer> {
  const agencyName = toThaiNumber(data.agencyName);
  const docnum = toThaiNumber(data.docNum);
  const date = getThaiDate(data.date);
  const subject = toThaiNumber(data.subject);
  const receiver = toThaiNumber(data.receiver);
  const from = toThaiNumber(data.from);
  const signName = toThaiNumber(data.signName);
  const position = toThaiNumber(data.position);
  const paragraphs = (data.paragraphs || [])
    .map((x) => toThaiNumber(x).replace(/\s+/g, " ").trim())
    .filter((x) => x);
  const references = (data.references || [])
    .map((x) => toThaiNumber(x))
    .filter((x) => x.trim());
  const attachments = (data.attachments || [])
    .map((x) => toThaiNumber(x))
    .filter((x) => x.trim());

  let garuda: ImageRun | null = null;
  try {
    const imgPath = path.join(process.cwd(), "public", "krut.png");
    const buf = await readFile(imgPath);
    garuda = new ImageRun({
      type: "png",
      data: buf,
      transformation: { width: 60, height: 60 },
      altText: { title: "ครุฑ", description: "ตราครุฑ", name: "krut" },
    });
  } catch {
    garuda = null;
  }

  const children: Paragraph[] = [];

  if (data.urgency) {
    children.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [run(data.urgency, { bold: true, color: "CC0000", size: 48 })],
      }),
    );
  }

  children.push(
    new Paragraph({
      spacing: { after: 80 },
      children: [...(garuda ? [garuda, run("  ")] : []), run("บันทึกข้อความ", { bold: true, size: 36 })],
    }),
  );

  children.push(richLabel("ส่วนราชการ", agencyName));
  children.push(
    new Paragraph({
      spacing: { after: 100 },
      children: [
        run("ที่", { bold: true }),
        run(`  ${docnum}          `),
        run("วันที่", { bold: true }),
        run(`  ${date}`),
      ],
    }),
  );
  children.push(richLabel("เรื่อง", subject));
  children.push(richLabel(data.salutation, receiver.split(/\r?\n/)[0] || ""));
  receiver
    .split(/\r?\n/)
    .slice(1)
    .map((l) => l.trim())
    .filter(Boolean)
    .forEach((line) => {
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          indent: { left: convertInchesToTwip(0.6) },
          children: [run(line)],
        }),
      );
    });
  if (from) children.push(richLabel("จาก", from));
  if (references.length === 1) children.push(richLabel("อ้างถึง", references[0]!));
  if (references.length > 1) {
    children.push(new Paragraph({ children: [run("อ้างถึง", { bold: true })] }));
    references.forEach((item, i) => {
      children.push(
        new Paragraph({
          indent: { left: convertInchesToTwip(0.4) },
          children: [run(`${toThaiNumber(i + 1)}. ${item}`)],
        }),
      );
    });
  }
  if (attachments.length === 1) children.push(richLabel("สิ่งที่ส่งมาด้วย", attachments[0]!));
  if (attachments.length > 1) {
    children.push(new Paragraph({ children: [run("สิ่งที่ส่งมาด้วย", { bold: true })] }));
    attachments.forEach((item, i) => {
      children.push(
        new Paragraph({
          indent: { left: convertInchesToTwip(0.4) },
          children: [run(`${toThaiNumber(i + 1)}. ${item}`)],
        }),
      );
    });
  }

  for (const para of paragraphs) {
    children.push(
      new Paragraph({
        spacing: { after: 100, line: 276, lineRule: LineRuleType.AUTO },
        indent: { firstLine: convertInchesToTwip(0.98) },
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
              top: convertInchesToTwip(0.79),
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
