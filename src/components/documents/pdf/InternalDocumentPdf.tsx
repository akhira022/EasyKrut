import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { InternalLetterPayload } from "@/lib/documents/internal/schema";
import { getThaiDate, insertThaiWordBreaks, toThaiNumber } from "@/lib/thai";
import { PDF_FONT_FAMILY } from "./fontFamily";

/** cm → pt (1 in = 2.54 cm = 72 pt) */
const cm = (n: number) => (n / 2.54) * 72;

/** ความกว้างที่ป้าย「วันที่」 20pt ตัวหนากินจริง — ใช้กำหนดจุดเริ่มเส้นประ */
const DATE_LABEL_WIDTH = 25;

const styles = StyleSheet.create({
  page: {
    fontFamily: PDF_FONT_FAMILY,
    fontSize: 16,
    lineHeight: 1.15,
    color: "#000",
    // Official memo margins: Left 3cm · Right/Top/Bottom 2cm
    paddingTop: cm(2),
    paddingRight: cm(2),
    paddingBottom: cm(2),
    paddingLeft: cm(3),
  },
  urgency: {
    color: "#c00",
    fontWeight: 700,
    fontSize: 32,
    marginBottom: 4,
  },
  /** หัวข้อจัดกลางหน้า และดันลงมาอยู่แนวล่างของครุฑ (ระดับเท้าครุฑ) */
  memoHeader: {
    position: "relative",
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: cm(0.5),
    minHeight: cm(1.5),
  },
  garuda: {
    position: "absolute",
    left: 0,
    top: 0,
    width: cm(1.5),
    height: cm(1.5),
    objectFit: "contain",
  },
  memoTitle: {
    width: "100%",
    textAlign: "center",
    fontSize: 24,
    fontWeight: 700,
  },
  memoMeta: {
    marginBottom: 6,
  },
  meta: {
    flexDirection: "row",
    marginTop: 4,
    flexWrap: "wrap",
  },
  /** Header rows (ส่วนราชการ / ที่·วันที่ / เรื่อง) */
  memoRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 4,
    paddingBottom: 2,
    minHeight: 20,
  },
  /**
   * Label (20pt) and value (16pt) must sit on one baseline. Flexbox in
   * @react-pdf/renderer has no `baseline` alignment — bottom-aligning two
   * boxes of different font size leaves the smaller text floating above the
   * label — so each row is a single line box with the label and value as
   * nested inline runs, which do share a baseline.
   */
  memoLine: {
    flex: 1,
  },
  /** เส้นคั่นระหว่างส่วนหัวกับเนื้อหา — หนากว่าและปิดไม่ได้ */
  memoSeparator: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#000",
    marginBottom: 6,
  },
  /** ป้าย 20pt ตัวหนา · ค่าที่กรอก 16pt */
  memoLabel: {
    fontSize: 20,
    fontWeight: 700,
  },
  /**
   * เส้นประวันที่ลากใต้ตัวเลขไปจนสุดขอบขวา
   *
   * วางแบบ absolute เพื่อไม่ให้เข้าไปยุ่งกับการจัดบรรทัด — ถ้าเอาข้อความวันที่
   * ไปใส่กล่องที่มีเส้นใต้ กล่องนั้นจะกลายเป็น flex item แยก แล้วตัวเลข 16pt
   * จะลอยสูงกว่า baseline ของป้าย 20pt อยู่ ~4.9pt
   */
  memoDateRule: {
    position: "absolute",
    left: DATE_LABEL_WIDTH + 2,
    right: 0,
    bottom: -1,
    borderBottomWidth: 1.5,
    borderBottomStyle: "dotted",
    borderBottomColor: "#000",
  },
  metaLabel: {
    fontWeight: 700,
    marginRight: 8,
  },
  metaLabelPlain: {
    fontWeight: 400,
    marginRight: 8,
  },
  metaValue: {
    flex: 1,
  },
  /** "ที่" left half · "วันที่" right half (starts at page center) */
  docDateCol: {
    position: "relative",
    width: "50%",
    flexDirection: "row",
    alignItems: "flex-end",
  },
  metaList: {
    marginTop: 4,
  },
  metaListItem: {
    marginLeft: 24,
    marginTop: 2,
  },
  body: {
    marginTop: 6,
  },
  paragraph: {
    textAlign: "justify",
    textIndent: cm(2.5),
    marginBottom: 6,
  },
  signatureBlock: {
    marginLeft: "50%",
    width: "50%",
    marginTop: 12,
  },
  signSpace: {
    height: cm(2.5),
  },
  signName: {
    textAlign: "center",
  },
  signPosition: {
    textAlign: "center",
  },
});

/** Split into trimmed, non-empty lines, each with Thai word-wrap markers applied. */
function linesOf(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map(insertThaiWordBreaks);
}

function numberedItems(items: string[]): string[] {
  return items
    .map((x) => toThaiNumber(x))
    .filter((x) => x.trim() !== "")
    .map(insertThaiWordBreaks);
}

function MetaRow({
  label,
  value,
  boldLabel = true,
}: {
  label: string;
  value: string;
  boldLabel?: boolean;
}) {
  if (!value.trim()) return null;
  return (
    <View style={styles.meta}>
      <Text style={boldLabel ? styles.metaLabel : styles.metaLabelPlain}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function MetaList({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  if (items.length === 1) {
    return <MetaRow label={label} value={items[0]!} boldLabel={false} />;
  }
  return (
    <View style={styles.metaList}>
      <Text style={styles.metaLabelPlain}>{label}</Text>
      {items.map((item, i) => (
        <Text key={i} style={styles.metaListItem}>
          {toThaiNumber(i + 1)}. {item}
        </Text>
      ))}
    </View>
  );
}

/** One header row: bold label and value as inline runs sharing a baseline. */
function MemoLine({ label, value }: { label: string; value: string }) {
  return (
    <Text style={styles.memoLine}>
      <Text style={styles.memoLabel}>{label}</Text>
      {value ? <Text>{`  ${value}`}</Text> : null}
    </Text>
  );
}

type Props = {
  data: InternalLetterPayload;
  /**
   * Garuda emblem image source. Prefer passing a `Buffer` (e.g. via
   * `getGarudaImageBuffer()`) when rendering server-side with
   * `renderToBuffer()` — a filesystem path string is unreliable on Windows.
   * A `/public`-relative URL string (default) only works when rendered
   * client-side in the browser.
   */
  garudaSrc?: string | Buffer;
};

export function InternalDocumentPdf({ data, garudaSrc = "/krut.png" }: Props) {
  const agencyName = insertThaiWordBreaks(toThaiNumber(data.agencyName));
  const docnum = toThaiNumber(data.docNum);
  const date = getThaiDate(data.date);
  const subject = insertThaiWordBreaks(toThaiNumber(data.subject));
  const receiver = insertThaiWordBreaks(toThaiNumber(data.receiver));
  const from = insertThaiWordBreaks(toThaiNumber(data.from));
  const references = numberedItems(data.references || []);
  const attachments = numberedItems(data.attachments || []);
  const signName = toThaiNumber(data.signName);
  const position = toThaiNumber(data.position);
  const paragraphs = (data.paragraphs || [])
    .map((p) => toThaiNumber(p).replace(/\s+/g, " ").trim())
    .filter((p) => p !== "")
    .map(insertThaiWordBreaks);
  const closingText = toThaiNumber(data.closing).replace(/\s+/g, " ").trim();
  const closing = closingText ? insertThaiWordBreaks(closingText) : "";
  const positionLines = linesOf(position);

  return (
    <Document title="บันทึกข้อความ" author="EasyKrut">
      <Page size="A4" style={styles.page} wrap>
        {data.urgency ? <Text style={styles.urgency}>{data.urgency}</Text> : null}

        <View style={styles.memoHeader}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image */}
          <Image src={garudaSrc} style={styles.garuda} />
          <Text style={styles.memoTitle}>บันทึกข้อความ</Text>
        </View>

        <View style={styles.memoMeta}>
          <View style={styles.memoRow}>
            <MemoLine label="ส่วนราชการ" value={agencyName} />
          </View>

          <View style={styles.memoRow}>
            <View style={styles.docDateCol}>
              <MemoLine label="ที่" value={docnum} />
            </View>
            <View style={styles.docDateCol}>
              {/* เส้นวันที่คงไว้เสมอ เพื่อให้กรอกเพิ่มเติมในเอกสารได้ */}
              <View style={styles.memoDateRule} />
              <MemoLine label="วันที่" value={date} />
            </View>
          </View>

          <View style={[styles.memoRow, styles.memoSeparator]}>
            <MemoLine label="เรื่อง" value={subject} />
          </View>
        </View>

        <MetaRow label={data.salutation} value={receiver} boldLabel={false} />
        <MetaRow label="จาก" value={from} boldLabel={false} />
        <MetaList label="อ้างถึง" items={references} />
        <MetaList label="สิ่งที่ส่งมาด้วย" items={attachments} />

        <View style={styles.body}>
          {paragraphs.map((p, i) => (
            <Text key={i} style={styles.paragraph}>
              {p}
            </Text>
          ))}
          {closing ? (
            <Text style={styles.paragraph}>{closing}</Text>
          ) : null}
        </View>

        <View style={styles.signatureBlock} wrap={false}>
          <View style={styles.signSpace} />
          {signName ? <Text style={styles.signName}>({signName})</Text> : null}
          {positionLines.map((line, i) => (
            <Text key={i} style={styles.signPosition}>
              {line}
            </Text>
          ))}
        </View>
      </Page>
    </Document>
  );
}
