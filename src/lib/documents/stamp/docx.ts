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
import type { StampLetterPayload } from "@/lib/documents/stamp/schema";
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

export async function buildStampDocx(data: StampLetterPayload): Promise<Buffer> {
  const docnum = toThaiNumber(data.docNum);
  const to = toThaiNumber(data.to);
  const date = getThaiDate(data.date);
  const senderAgency = toThaiNumber(data.senderAgency);
  const initials = toThaiNumber(data.initials);
  const contactUnit = toThaiNumber(data.contactUnit);
  const tel = toThaiNumber(data.tel);
  const address = toThaiNumber(data.address);
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
      transformation: { width: 85, height: 85 },
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
      spacing: { after: 100 },
      children: [run("ที่", { bold: true }), run(`  ${docnum}`)],
    }),
  );

  children.push(
    new Paragraph({
      spacing: { after: 100 },
      children: [run("ถึง  "), run(to.split(/\r?\n/)[0] || "")],
    }),
  );
  to
    .split(/\r?\n/)
    .slice(1)
    .map((l) => l.trim())
    .filter(Boolean)
    .forEach((line) => {
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          indent: { left: convertInchesToTwip(0.45) },
          children: [run(line)],
        }),
      );
    });

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

  // Stamp / sender block on the right half
  if (senderAgency) {
    children.push(
      new Paragraph({
        indent: { left: convertInchesToTwip(3.15) },
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 60 },
        children: [run(senderAgency)],
      }),
    );
  }
  children.push(
    new Paragraph({
      indent: { left: convertInchesToTwip(3.15) },
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [run("ตราชื่อส่วนราชการ", { color: "CC0000", size: 24 })],
    }),
  );
  if (initials) {
    children.push(
      new Paragraph({
        indent: { left: convertInchesToTwip(3.15) },
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [run(initials)],
      }),
    );
  }
  if (date) {
    children.push(
      new Paragraph({
        indent: { left: convertInchesToTwip(3.15) },
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [run(date)],
      }),
    );
  }

  if (contactUnit) {
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 40 },
        children: [run(contactUnit)],
      }),
    );
  }
  if (tel) {
    children.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [run(`โทร. ${tel}`)],
      }),
    );
  }
  if (address) {
    address
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((line) => {
        children.push(
          new Paragraph({
            spacing: { after: 20 },
            children: [run(line)],
          }),
        );
      });
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

  return Buffer.from(await Packer.toBuffer(doc));
}
