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
import { getThaiDate, toThaiNumber } from "@/lib/thai";

const FONT = "TH SarabunPSK";
const SIZE = 32;

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

export function a4Section(children: Paragraph[]) {
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
              top: convertInchesToTwip(0.98),
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
}): Promise<Buffer> {
  const heading = toThaiNumber(opts.heading);
  const docNum = toThaiNumber(opts.docNum ?? "");
  const subject = toThaiNumber(opts.subject);
  const date = getThaiDate(opts.date);
  const signName = toThaiNumber(opts.signName);
  const position = toThaiNumber(opts.position);
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
      spacing: { after: 100 },
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
  if (date) {
    children.push(
      new Paragraph({
        indent: { left: convertInchesToTwip(3.15) },
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 80 },
        children: [run(`${opts.dateLabel} ${date}`)],
      }),
    );
  }
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
          children: [run(line)],
        }),
      );
    });

  return Buffer.from(await Packer.toBuffer(a4Section(children)));
}
