import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { getThaiDate, insertThaiWordBreaks, toThaiNumber } from "@/lib/thai";
import { PDF_FONT_FAMILY } from "./fontFamily";

const cm = (n: number) => (n / 2.54) * 72;

const styles = StyleSheet.create({
  page: {
    fontFamily: PDF_FONT_FAMILY,
    fontSize: 16,
    lineHeight: 1.15,
    color: "#000",
    paddingTop: cm(2.5),
    paddingRight: cm(2),
    paddingBottom: cm(2),
    paddingLeft: cm(3),
  },
  pageOfficial: { paddingTop: cm(1.5) },
  urgency: {
    color: "#c00",
    fontWeight: 700,
    fontSize: 18,
    marginBottom: 4,
  },
  garudaWrap: { alignItems: "center", marginBottom: cm(0.3) },
  garuda: { width: cm(3), height: cm(3), objectFit: "contain" },
  heading: { textAlign: "center", fontSize: 18, marginBottom: 6 },
  center: { textAlign: "center", marginTop: 4 },
  meta: { flexDirection: "row", marginTop: 6, justifyContent: "center" },
  metaLeft: { justifyContent: "flex-start" },
  /** เส้นคั่นใต้ «เรื่อง» ก่อนเข้าเนื้อหา */
  metaSeparator: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#000",
    paddingBottom: 2,
    marginBottom: 6,
  },
  metaLabel: { marginRight: 8 },
  body: { marginTop: 8 },
  paragraph: {
    textAlign: "justify",
    textIndent: cm(2.5),
    marginBottom: 6,
  },
  effective: {
    textAlign: "justify",
    textIndent: cm(2.5),
    marginTop: 6,
  },
  signBlock: {
    marginLeft: "50%",
    width: "50%",
    marginTop: 16,
    alignItems: "center",
  },
  signBlockCenter: {
    marginLeft: 0,
    width: "100%",
    marginTop: 0,
    alignItems: "center",
  },
  officialDate: {
    textAlign: "center",
    marginTop: 12,
  },
  signSpace: { height: cm(2.5) },
  /** 4 Enter ที่ 16pt */
  signSpaceOfficial: { height: 64 },
  signName: { textAlign: "center" },
});

export type CenteredOfficialPdfProps = {
  title: string;
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
  garudaSrc?: string | Buffer;
};

export function CenteredOfficialPdf({
  title,
  urgency,
  heading,
  docNum,
  subject,
  paragraphs,
  dateLabel,
  date,
  signName,
  position,
  effectiveFrom,
  separator,
  variant,
  garudaSrc = "/krut.png",
}: CenteredOfficialPdfProps) {
  const announce = variant === "announce";
  const officialCenter = announce || variant === "order";
  const headingText = insertThaiWordBreaks(toThaiNumber(heading));
  const num = toThaiNumber(docNum ?? "");
  const subjectText = insertThaiWordBreaks(toThaiNumber(subject));
  const dateText = getThaiDate(date, { era: officialCenter });
  const sign = toThaiNumber(signName);
  const effective = insertThaiWordBreaks(
    toThaiNumber(effectiveFrom).replace(/\s+/g, " ").trim(),
  );
  const posLines = toThaiNumber(position)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map(insertThaiWordBreaks);
  const paras = (paragraphs || [])
    .map((p) => toThaiNumber(p).replace(/\s+/g, " ").trim())
    .filter((p) => p !== "")
    .map(insertThaiWordBreaks);

  return (
    <Document title={title} author="EasyKrut">
      <Page
        size="A4"
        style={officialCenter ? [styles.page, styles.pageOfficial] : styles.page}
        wrap
      >
        {urgency ? <Text style={styles.urgency}>{urgency}</Text> : null}
        <View style={styles.garudaWrap}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image */}
          <Image src={garudaSrc} style={styles.garuda} />
        </View>
        <Text style={styles.heading}>{headingText}</Text>
        {docNum !== undefined ? <Text style={styles.center}>ที่ {num}</Text> : null}
        <View
          style={[
            styles.meta,
            ...(announce ? [styles.metaLeft] : []),
            ...(separator ? [styles.metaSeparator] : []),
          ]}
        >
          <Text style={styles.metaLabel}>เรื่อง</Text>
          <Text>{subjectText}</Text>
        </View>
        <View style={styles.body}>
          {paras.map((p, i) => (
            <Text key={i} style={styles.paragraph}>
              {p}
            </Text>
          ))}
        </View>
        {variant === "order" && effective ? (
          <Text style={styles.effective}>ทั้งนี้ ตั้งแต่ {effective}</Text>
        ) : null}
        {officialCenter && dateText ? (
          <Text style={styles.officialDate}>
            {dateLabel} {dateText}
          </Text>
        ) : null}
        <View style={officialCenter ? styles.signBlockCenter : styles.signBlock} wrap={false}>
          {!officialCenter && dateText ? (
            <Text style={styles.center}>
              {dateLabel} {dateText}
            </Text>
          ) : null}
          <View style={officialCenter ? styles.signSpaceOfficial : styles.signSpace} />
          {sign ? <Text style={styles.signName}>({sign})</Text> : null}
          {posLines.map((line, i) => (
            <Text key={i} style={styles.signName}>
              {line}
            </Text>
          ))}
        </View>
      </Page>
    </Document>
  );
}
