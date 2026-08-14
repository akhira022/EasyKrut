import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { CertLetterPayload } from "@/lib/documents/cert/schema";
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
  garudaWrap: { alignItems: "center", marginBottom: cm(0.3) },
  garuda: { width: cm(3), height: cm(3), objectFit: "contain" },
  top: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  agency: { width: "50%", textAlign: "left" },
  paragraph: {
    textAlign: "justify",
    textIndent: cm(2.5),
    marginTop: 10,
    marginBottom: 6,
  },
  bottom: { flexDirection: "row", marginTop: 20, alignItems: "flex-start" },
  photo: {
    width: cm(4),
    height: cm(6),
    borderWidth: 0.75,
    borderColor: "#999",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginRight: cm(1),
  },
  photoLabel: { fontSize: 11, color: "#888" },
  signBlock: { flex: 1, alignItems: "center" },
  signSpace: { height: cm(2.5) },
  center: { textAlign: "center" },
});

export function CertDocumentPdf({
  data,
  garudaSrc = "/krut.png",
}: {
  data: CertLetterPayload;
  garudaSrc?: string | Buffer;
}) {
  const docnum = toThaiNumber(data.docNum);
  const agencyName = insertThaiWordBreaks(toThaiNumber(data.agencyName));
  const addressLines = toThaiNumber(data.agencyAddress)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map(insertThaiWordBreaks);
  const certifiedName = insertThaiWordBreaks(toThaiNumber(data.certifiedName));
  const date = getThaiDate(data.date);
  const signName = toThaiNumber(data.signName);
  const positionLines = toThaiNumber(data.position)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const paragraphs = (data.paragraphs || [])
    .map((p) => toThaiNumber(p).replace(/\s+/g, " ").trim())
    .filter((p) => p !== "")
    .map(insertThaiWordBreaks);
  const first = paragraphs[0] ?? "";

  return (
    <Document title="หนังสือรับรอง" author="EasyKrut">
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.garudaWrap}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image */}
          <Image src={garudaSrc} style={styles.garuda} />
        </View>
        <View style={styles.top}>
          <Text>ที่ {docnum}</Text>
          <View style={styles.agency}>
            <Text>{agencyName}</Text>
            {addressLines.map((line, i) => (
              <Text key={i}>{line}</Text>
            ))}
          </View>
        </View>
        <Text style={styles.paragraph}>
          หนังสือฉบับนี้ให้ไว้เพื่อรับรองว่า {certifiedName}
          {first ? ` ${first}` : ""}
        </Text>
        {paragraphs.slice(1).map((p, i) => (
          <Text key={i} style={styles.paragraph}>
            {p}
          </Text>
        ))}
        <View style={styles.bottom} wrap={false}>
          <View style={styles.photo}>
            <Text style={styles.photoLabel}>รูปถ่าย ๔×๖ ซม.</Text>
          </View>
          <View style={styles.signBlock}>
            {date ? <Text style={styles.center}>ให้ไว้ ณ วันที่ {date}</Text> : null}
            <View style={styles.signSpace} />
            {signName ? <Text style={styles.center}>({signName})</Text> : null}
            {positionLines.map((line, i) => (
              <Text key={i} style={styles.center}>
                {line}
              </Text>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );
}
