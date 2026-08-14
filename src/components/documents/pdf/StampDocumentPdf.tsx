import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { StampLetterPayload } from "@/lib/documents/stamp/schema";
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
  garudaWrap: {
    alignItems: "center",
    marginBottom: cm(0.4),
  },
  garuda: {
    width: cm(3),
    height: cm(3),
    objectFit: "contain",
  },
  docnum: {
    marginTop: 6,
  },
  meta: {
    flexDirection: "row",
    marginTop: 6,
    flexWrap: "wrap",
  },
  metaLabel: {
    fontWeight: 400,
    marginRight: 8,
  },
  metaValue: {
    flex: 1,
  },
  body: {
    marginTop: 6,
  },
  paragraph: {
    textAlign: "justify",
    textIndent: cm(2.5),
    marginBottom: 6,
  },
  stampBlock: {
    marginLeft: "50%",
    width: "50%",
    marginTop: 16,
    alignItems: "center",
  },
  sender: {
    textAlign: "center",
    marginBottom: 6,
  },
  seal: {
    width: cm(3.2),
    height: cm(3.2),
    borderWidth: 1.5,
    borderColor: "#c00",
    borderRadius: cm(1.6),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  sealLabel: {
    color: "#c00",
    fontSize: 11,
    textAlign: "center",
  },
  initials: {
    textAlign: "center",
    marginBottom: 4,
  },
  date: {
    textAlign: "center",
  },
  contact: {
    marginTop: cm(1.5),
    fontSize: 15,
    lineHeight: 1.3,
  },
});

type Props = {
  data: StampLetterPayload;
  garudaSrc?: string | Buffer;
};

export function StampDocumentPdf({ data, garudaSrc = "/krut.png" }: Props) {
  const docnum = toThaiNumber(data.docNum);
  const to = insertThaiWordBreaks(toThaiNumber(data.to));
  const date = getThaiDate(data.date);
  const senderAgency = insertThaiWordBreaks(toThaiNumber(data.senderAgency));
  const initials = toThaiNumber(data.initials);
  const contactUnit = insertThaiWordBreaks(toThaiNumber(data.contactUnit));
  const tel = toThaiNumber(data.tel);
  const addressLines = toThaiNumber(data.address)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map(insertThaiWordBreaks);
  const paragraphs = (data.paragraphs || [])
    .map((p) => toThaiNumber(p).replace(/\s+/g, " ").trim())
    .filter((p) => p !== "")
    .map(insertThaiWordBreaks);

  return (
    <Document title="หนังสือประทับตรา" author="EasyKrut">
      <Page size="A4" style={styles.page} wrap>
        {data.urgency ? <Text style={styles.urgency}>{data.urgency}</Text> : null}

        <View style={styles.garudaWrap}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image */}
          <Image src={garudaSrc} style={styles.garuda} />
        </View>

        <Text style={styles.docnum}>ที่ {docnum}</Text>

        <View style={styles.meta}>
          <Text style={styles.metaLabel}>ถึง</Text>
          <Text style={styles.metaValue}>{to}</Text>
        </View>

        <View style={styles.body}>
          {paragraphs.map((p, i) => (
            <Text key={i} style={styles.paragraph}>
              {p}
            </Text>
          ))}
        </View>

        <View style={styles.stampBlock} wrap={false}>
          {senderAgency ? <Text style={styles.sender}>{senderAgency}</Text> : null}
          <View style={styles.seal}>
            <Text style={styles.sealLabel}>ตราชื่อ{"\n"}ส่วนราชการ</Text>
          </View>
          {initials ? <Text style={styles.initials}>{initials}</Text> : null}
          {date ? <Text style={styles.date}>{date}</Text> : null}
        </View>

        <View style={styles.contact} wrap={false}>
          {contactUnit ? <Text>{contactUnit}</Text> : null}
          {tel ? <Text>โทร. {tel}</Text> : null}
          {addressLines.map((line, i) => (
            <Text key={i}>{line}</Text>
          ))}
        </View>
      </Page>
    </Document>
  );
}
