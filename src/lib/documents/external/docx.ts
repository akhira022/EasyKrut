import {
  AlignmentType,
  Document,
  ImageRun,
  Packer,
  Paragraph,
  TextRun,
  convertInchesToTwip,
} from "docx";
import { readFile } from "fs/promises";
import path from "path";
import type { ExternalLetterPayload } from "@/lib/documents/external/schema";
import { getThaiDate, toThaiNumber } from "@/lib/thai";

function p(text: string) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({
        text,
        font: "TH SarabunPSK",
        size: 32, // 16pt
      }),
    ],
  });
}

function richLabel(label: string, value: string) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({ text: label, font: "TH SarabunPSK", size: 32, bold: true }),
      new TextRun({ text: `  ${value}`, font: "TH SarabunPSK", size: 32 }),
    ],
  });
}

export async function buildExternalDocx(data: ExternalLetterPayload): Promise<Buffer> {
  const dept = toThaiNumber(data.department);
  const docnum = toThaiNumber(data.docNum);
  const date = getThaiDate(data.date);
  const subject = toThaiNumber(data.subject);
  const receiver = toThaiNumber(data.receiver);
  const attachment = toThaiNumber(data.attachment);
  const reference = toThaiNumber(data.reference);
  const signName = toThaiNumber(data.signName);
  const position = toThaiNumber(data.position);
  const tel = toThaiNumber(data.tel);
  const fax = toThaiNumber(data.fax);
  const paragraphs = (data.paragraphs || [])
    .map((x) => toThaiNumber(x))
    .filter((x) => x.trim());

  let garuda: ImageRun | null = null;
  try {
    const imgPath = path.join(process.cwd(), "public", "krut.png");
    const buf = await readFile(imgPath);
    garuda = new ImageRun({
      type: "png",
      data: buf,
      transformation: { width: 113, height: 113 }, // ~3cm
      altText: { title: "ครุฑ", description: "ตราครุฑ", name: "krut" },
    });
  } catch {
    garuda = null;
  }

  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({ text: `ที่ ${docnum}`, font: "TH SarabunPSK", size: 32 }),
        new TextRun({ text: "\t\t\t", font: "TH SarabunPSK", size: 32 }),
        ...(garuda ? [garuda] : []),
        new TextRun({ text: "\t\t\t", font: "TH SarabunPSK", size: 32 }),
        new TextRun({ text: dept, font: "TH SarabunPSK", size: 32 }),
      ],
    }),
  );

  if (date) {
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 200 },
        indent: { left: convertInchesToTwip(3) },
        children: [new TextRun({ text: date, font: "TH SarabunPSK", size: 32 })],
      }),
    );
  }

  if (subject) children.push(richLabel("เรื่อง", subject));
  if (receiver) children.push(richLabel(data.salutation, receiver));
  if (reference) children.push(richLabel("อ้างถึง", reference));
  if (attachment) children.push(richLabel("สิ่งที่ส่งมาด้วย", attachment));

  for (const para of paragraphs) {
    children.push(
      new Paragraph({
        spacing: { after: 160 },
        indent: { firstLine: convertInchesToTwip(0.98) },
        alignment: AlignmentType.BOTH,
        children: [new TextRun({ text: para, font: "TH SarabunPSK", size: 32 })],
      }),
    );
  }

  children.push(new Paragraph({ children: [] }));
  children.push(
    new Paragraph({
      indent: { left: convertInchesToTwip(3) },
      spacing: { after: 400 },
      children: [new TextRun({ text: data.closing, font: "TH SarabunPSK", size: 32 })],
    }),
  );
  children.push(
    new Paragraph({
      indent: { left: convertInchesToTwip(3) },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "(ลงชื่อ).......................................................",
          font: "TH SarabunPSK",
          size: 32,
        }),
      ],
    }),
  );
  if (signName) {
    children.push(
      new Paragraph({
        indent: { left: convertInchesToTwip(3) },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: signName, font: "TH SarabunPSK", size: 32 })],
      }),
    );
  }
  if (position) {
    children.push(
      new Paragraph({
        indent: { left: convertInchesToTwip(3) },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: position, font: "TH SarabunPSK", size: 32 })],
      }),
    );
  }

  children.push(new Paragraph({ spacing: { before: 400 }, children: [] }));
  if (dept) children.push(p(dept.split(" ")[0] ?? dept));
  if (tel) children.push(p(`โทร. ${tel}`));
  if (fax) children.push(p(`โทรสาร ${fax}`));
  if (data.email) children.push(p(`ไปรษณีย์อิเล็กทรอนิกส์ ${data.email}`));

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
