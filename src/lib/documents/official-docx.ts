import {
  AlignmentType,
  BorderStyle,
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
import { getThaiDate, toThaiNumber } from "@/lib/thai";

const FONT = "TH SarabunPSK";
const SIZE = 32;

/** เส้นคั่นระหว่างส่วนหัวกับเนื้อหา (size หน่วย 1/8 pt) */
const SEPARATOR_BORDER = {
  bottom: { style: BorderStyle.SINGLE, size: 12, color: "000000", space: 1 },
};

export function run(text: string, opts?: { bold?: boolean; color?: string; size?: number }) {
  return new TextRun({
    text,
    font: FONT,
    size: opts?.size ?? SIZE,
    bold: opts?.bold,
    color: opts?.color,
  });
}

export async function loadGaruda(): Promise<ImageRun | null> {
  try {
    const imgPath = path.join(process.cwd(), "public", "krut.png");
    const buf = await readFile(imgPath);
    return new ImageRun({
      type: "png",
      data: buf,
      transformation: { width: 85, height: 85 },
      altText: { title: "ครุฑ", description: "ตราครุฑ", name: "krut" },
    });
  } catch {
    return null;
  }
}

export function a4Section(children: Paragraph[], opts?: { topCm?: number }) {
  const topCm = opts?.topCm ?? 2.5;
  return new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: convertInchesToTwip(8.27),
              height: convertInchesToTwip(11.69),
            },
            margin: {
              top: convertInchesToTwip(topCm / 2.54),
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
}

export async function buildCenteredOfficialDocx(opts: {
  urgency?: string;
  heading: string;
  docNum?: string;
  subject: string;
  paragraphs: string[];
  dateLabel: string;
  date: string;
  signName: string;
  position: string;
  effectiveFrom?: string;
  /** เส้นคั่นใต้ «เรื่อง» ก่อนเข้าเนื้อหา */
  separator?: boolean;
  /** รูปแบบเฉพาะตามแบบราชการ */
  variant?: "announce" | "order";
}): Promise<Buffer> {
  const announce = opts.variant === "announce";
  const order = opts.variant === "order";
  const officialCenter = announce || order;
  const heading = toThaiNumber(opts.heading);
  const docNum = toThaiNumber(opts.docNum ?? "");
  const subject = toThaiNumber(opts.subject);
  const date = getThaiDate(opts.date, { era: officialCenter });
  const signName = toThaiNumber(opts.signName);
  const position = toThaiNumber(opts.position);
  const effectiveFrom = toThaiNumber(opts.effectiveFrom).replace(/\s+/g, " ").trim();
  const paragraphs = (opts.paragraphs || [])
    .map((x) => toThaiNumber(x).replace(/\s+/g, " ").trim())
    .filter((x) => x);

  const garuda = await loadGaruda();
  const children: Paragraph[] = [];

  if (opts.urgency) {
    children.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [run(opts.urgency, { bold: true, color: "CC0000", size: 48 })],
      }),
    );
  }
  if (garuda) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [garuda],
      }),
    );
  }
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [run(heading, { bold: true, size: 36 })],
    }),
  );
  if (opts.docNum !== undefined) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [run(`ที่  ${docNum}`)],
      }),
    );
  }
  children.push(
    new Paragraph({
      alignment: order ? AlignmentType.CENTER : undefined,
      spacing: { after: opts.separator ? 40 : 100 },
      border: opts.separator ? SEPARATOR_BORDER : undefined,
      children: [run("เรื่อง  "), run(subject)],
    }),
  );
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
  if (order && effectiveFrom) {
    children.push(
      new Paragraph({
        spacing: { before: 120, after: 0, line: 276, lineRule: LineRuleType.AUTO },
        indent: { firstLine: convertInchesToTwip(0.98) },
        alignment: AlignmentType.THAI_DISTRIBUTE,
        children: [run(`ทั้งนี้ ตั้งแต่ ${effectiveFrom}`)],
      }),
    );
  }
  const signIndent = officialCenter ? undefined : { left: convertInchesToTwip(3.15) };
  if (date) {
    children.push(
      new Paragraph({
        indent: signIndent,
        alignment: AlignmentType.CENTER,
        spacing: { before: officialCenter ? 240 : 200, after: officialCenter ? 0 : 80 },
        children: [run(`${opts.dateLabel} ${date}`)],
      }),
    );
  }
  if (officialCenter) {
    for (let i = 0; i < 4; i++) {
      children.push(
        new Paragraph({
          spacing: { after: 0, line: 276, lineRule: LineRuleType.AUTO },
          children: [run("")],
        }),
      );
    }
  } else {
    children.push(
      new Paragraph({
        indent: signIndent,
        spacing: { after: 200 },
        children: [run(" ")],
      }),
    );
  }
  if (signName) {
    children.push(
      new Paragraph({
        indent: signIndent,
        alignment: AlignmentType.CENTER,
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
          indent: signIndent,
          alignment: AlignmentType.CENTER,
          children: [run(line)],
        }),
      );
    });

  return Buffer.from(
    await Packer.toBuffer(a4Section(children, officialCenter ? { topCm: 1.5 } : undefined)),
  );
}
