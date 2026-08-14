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
  metaLabel: { marginRight: 8 },
  body: { marginTop: 8 },
  paragraph: {
    textAlign: "justify",
    textIndent: cm(2.5),
    marginBottom: 6,
  },
  signBlock: {
    marginLeft: "50%",
    width: "50%",
    marginTop: 16,
    alignItems: "center",
  },
  signSpace: { height: cm(2.5) },
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
  garudaSrc = "/krut.png",
}: CenteredOfficialPdfProps) {
  const headingText = insertThaiWordBreaks(toThaiNumber(heading));
  const num = toThaiNumber(docNum ?? "");
  const subjectText = insertThaiWordBreaks(toThaiNumber(subject));
  const dateText = getThaiDate(date);
  const sign = toThaiNumber(signName);
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
      <Page size="A4" style={styles.page} wrap>
        {urgency ? <Text style={styles.urgency}>{urgency}</Text> : null}
        <View style={styles.garudaWrap}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image */}
          <Image src={garudaSrc} style={styles.garuda} />
        </View>
        <Text style={styles.heading}>{headingText}</Text>
        {docNum !== undefined ? <Text style={styles.center}>ที่ {num}</Text> : null}
        <View style={styles.meta}>
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
        <View style={styles.signBlock} wrap={false}>
          {dateText ? (
            <Text style={styles.center}>
              {dateLabel} {dateText}
            </Text>
          ) : null}
          <View style={styles.signSpace} />
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
