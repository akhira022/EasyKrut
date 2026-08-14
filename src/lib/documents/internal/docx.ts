import {
  AlignmentType,
  BorderStyle,
  Document,
  HorizontalPositionAlign,
  HorizontalPositionRelativeFrom,
  ImageRun,
  LeaderType,
  LineRuleType,
  Packer,
  Paragraph,
  TabStopType,
  TextRun,
  TextWrappingType,
  VerticalPositionAlign,
  VerticalPositionRelativeFrom,
  convertInchesToTwip,
} from "docx";
import { readFile } from "fs/promises";
import path from "path";
import type { InternalLetterPayload } from "@/lib/documents/internal/schema";
import { getThaiDate, toThaiNumber } from "@/lib/thai";

const FONT = "TH SarabunPSK";
const SIZE = 32;

const RULE_BORDER = {
  bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000", space: 1 },
};

/** เส้นคั่นระหว่างส่วนหัวกับเนื้อหา — หนากว่าเส้นประจำช่อง (size หน่วย 1/8 pt) */
const SEPARATOR_BORDER = {
  bottom: { style: BorderStyle.SINGLE, size: 12, color: "000000", space: 1 },
};

/** ป้ายหัวเรื่อง 20pt ตัวหนา (size หน่วย half-point) */
const LABEL_SIZE = 40;

/** ช่องที่ยังไม่กรอกเติมจุดไข่ปลาถึงขอบขวาของช่อง */
function dottedTabStops(position: number) {
  return [{ type: TabStopType.RIGHT, position, leader: LeaderType.DOT }];
}

function run(text: string, opts?: { bold?: boolean; color?: string; size?: number }) {
  return new TextRun({
    text,
    font: FONT,
    size: opts?.size ?? SIZE,
    bold: opts?.bold,
    color: opts?.color,
  });
}

/** ความกว้างเนื้อหา A4 หลังหักมาร์จินซ้าย/ขวา (twips) */
const CONTENT_WIDTH = convertInchesToTwip(8.27 - 1.18 - 0.79);

function richLabel(
  label: string,
  value: string,
  opts?: { ruled?: boolean; separator?: boolean },
) {
  const border = opts?.separator
    ? SEPARATOR_BORDER
    : opts?.ruled
      ? RULE_BORDER
      : undefined;
  return new Paragraph({
    spacing: { after: border ? 40 : 100 },
    border,
    tabStops: value.trim() ? undefined : dottedTabStops(CONTENT_WIDTH),
    children: value.trim()
      ? [run(label, { bold: true, size: LABEL_SIZE }), run(`  ${value}`)]
      : [run(label, { bold: true, size: LABEL_SIZE }), run("  "), run("\t")],
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
      floating: {
        horizontalPosition: {
          relative: HorizontalPositionRelativeFrom.PAGE,
          align: HorizontalPositionAlign.LEFT,
        },
        verticalPosition: {
          relative: VerticalPositionRelativeFrom.PAGE,
          align: VerticalPositionAlign.TOP,
        },
        wrap: { type: TextWrappingType.NONE },
        allowOverlap: true,
      },
    });
  } catch {
    garuda = null;
  }

  const children: Paragraph[] = [];

  if (data.urgency) {
    children.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [run(data.urgency, { bold: true, color: "CC0000", size: 64 })],
      }),
    );
  }

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        ...(garuda ? [garuda] : []),
        run("บันทึกข้อความ", { bold: true, size: 36 }),
      ],
    }),
  );

  const showAgencyRule = data.showAgencyRule ?? true;
  const showDocDateRule = data.showDocDateRule ?? true;

  children.push(richLabel("ส่วนราชการ", agencyName, { ruled: showAgencyRule }));
  const halfWidth = Math.round(CONTENT_WIDTH / 2);
  children.push(
    new Paragraph({
      spacing: { after: showDocDateRule ? 40 : 100 },
      border: showDocDateRule ? RULE_BORDER : undefined,
      tabStops: [
        { type: TabStopType.RIGHT, position: halfWidth - 200, leader: docnum.trim() ? LeaderType.NONE : LeaderType.DOT },
        { type: TabStopType.LEFT, position: halfWidth },
        { type: TabStopType.RIGHT, position: CONTENT_WIDTH, leader: date.trim() ? LeaderType.NONE : LeaderType.DOT },
      ],
      children: [
        run("ที่", { bold: true, size: LABEL_SIZE }),
        run(`  ${docnum}`),
        run("\t\t"),
        run("วันที่", { bold: true, size: LABEL_SIZE }),
        run(`  ${date}`),
        run("\t"),
      ],
    }),
  );
  children.push(richLabel("เรื่อง", subject, { separator: true }));
  children.push(
    new Paragraph({
      spacing: { after: 100 },
      children: [run(data.salutation), run(`  ${receiver.split(/\r?\n/)[0] || ""}`)],
    }),
  );
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

  const closingText = toThaiNumber(data.closing).replace(/\s+/g, " ").trim();
  if (closingText) {
    children.push(
      new Paragraph({
        spacing: { after: 100, line: 276, lineRule: LineRuleType.AUTO },
        indent: { firstLine: convertInchesToTwip(0.98) },
        alignment: AlignmentType.THAI_DISTRIBUTE,
        children: [run(closingText)],
      }),
    );
  }

  const signBlockIndent = convertInchesToTwip(3.15);
  const signSpaceBefore = convertInchesToTwip(2.5 / 2.54);
  children.push(
    new Paragraph({
      indent: { left: signBlockIndent },
      spacing: { before: signSpaceBefore, after: signName ? 40 : 0 },
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
