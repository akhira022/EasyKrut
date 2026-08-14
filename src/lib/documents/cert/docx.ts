import { AlignmentType, Paragraph, convertInchesToTwip } from "docx";
import type { CertLetterPayload } from "@/lib/documents/cert/schema";
import { a4Section, loadGaruda, run } from "@/lib/documents/official-docx";
import { Packer } from "docx";
import { getThaiDate, toThaiNumber } from "@/lib/thai";

export async function buildCertDocx(data: CertLetterPayload): Promise<Buffer> {
  const docnum = toThaiNumber(data.docNum);
  const agencyName = toThaiNumber(data.agencyName);
  const certifiedName = toThaiNumber(data.certifiedName);
  const date = getThaiDate(data.date);
  const signName = toThaiNumber(data.signName);
  const position = toThaiNumber(data.position);
  const paragraphs = (data.paragraphs || [])
    .map((x) => toThaiNumber(x).replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const garuda = await loadGaruda();
  const children: Paragraph[] = [];

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
      spacing: { after: 80 },
      children: [
        run(`ที่  ${docnum}                    `),
        run(agencyName),
      ],
    }),
  );
  toThaiNumber(data.agencyAddress)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .forEach((line) => {
      children.push(
        new Paragraph({
          indent: { left: convertInchesToTwip(3.15) },
          children: [run(line)],
        }),
      );
    });

  const first = paragraphs[0] ?? "";
  children.push(
    new Paragraph({
      spacing: { before: 200, after: 100 },
      indent: { firstLine: convertInchesToTwip(0.98) },
      alignment: AlignmentType.THAI_DISTRIBUTE,
      children: [run(`หนังสือฉบับนี้ให้ไว้เพื่อรับรองว่า ${certifiedName}${first ? ` ${first}` : ""}`)],
    }),
  );
  paragraphs.slice(1).forEach((p) => {
    children.push(
      new Paragraph({
        spacing: { after: 100 },
        indent: { firstLine: convertInchesToTwip(0.98) },
        alignment: AlignmentType.THAI_DISTRIBUTE,
        children: [run(p)],
      }),
    );
  });
  if (date) {
    children.push(
      new Paragraph({
        indent: { left: convertInchesToTwip(3.15) },
        alignment: AlignmentType.CENTER,
        spacing: { before: 200 },
        children: [run(`ให้ไว้ ณ วันที่ ${date}`)],
      }),
    );
  }
  children.push(new Paragraph({ spacing: { after: 200 }, children: [run(" ")] }));
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
