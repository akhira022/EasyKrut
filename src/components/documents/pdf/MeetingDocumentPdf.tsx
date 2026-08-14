import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { MeetingLetterPayload } from "@/lib/documents/meeting/schema";
import { getThaiDate, insertThaiWordBreaks, toThaiNumber } from "@/lib/thai";
import { PDF_FONT_FAMILY } from "./fontFamily";

const cm = (n: number) => (n / 2.54) * 72;

const styles = StyleSheet.create({
  page: {
    fontFamily: PDF_FONT_FAMILY,
    fontSize: 16,
    lineHeight: 1.15,
    color: "#000",
    paddingTop: cm(2),
    paddingRight: cm(2),
    paddingBottom: cm(2),
    paddingLeft: cm(3),
  },
  logo: {
    alignSelf: "center",
    width: cm(2),
    height: cm(2),
    borderWidth: 0.75,
    borderColor: "#bbb",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  logoLabel: { fontSize: 9, color: "#999" },
  heading: { textAlign: "center", fontSize: 18 },
  center: { textAlign: "center", marginTop: 3 },
  rule: {
    borderBottomWidth: 0.75,
    borderBottomColor: "#000",
    marginVertical: 10,
  },
  block: { marginTop: 8 },
  listItem: { marginLeft: 18, marginTop: 2 },
  paragraph: {
    textAlign: "justify",
    textIndent: cm(2.5),
    marginTop: 4,
  },
  agenda: { marginTop: 10 },
  signBlock: {
    marginLeft: "50%",
    width: "50%",
    marginTop: 16,
    alignItems: "center",
  },
  signSpace: { height: cm(2.5) },
});

function cleanList(items: string[]): string[] {
  return items
    .map((x) => insertThaiWordBreaks(toThaiNumber(x)))
    .filter((x) => x.replace(/\u200B/g, "").trim() !== "");
}

export function MeetingDocumentPdf({ data }: { data: MeetingLetterPayload }) {
  const committee = insertThaiWordBreaks(toThaiNumber(data.committee));
  const session = toThaiNumber(data.session);
  const date = getThaiDate(data.date);
  const place = insertThaiWordBreaks(toThaiNumber(data.place));
  const attendees = cleanList(data.attendees || []);
  const absentees = cleanList(data.absentees || []);
  const participants = cleanList(data.participants || []);
  const startTime = toThaiNumber(data.startTime);
  const endTime = toThaiNumber(data.endTime);
  const recorder = toThaiNumber(data.recorderName);
  const agendas = (data.agendas || []).filter(
    (a) => a.title.trim() || a.body.trim() || a.resolution.trim(),
  );

  return (
    <Document title="รายงานการประชุม" author="EasyKrut">
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.logo}>
          <Text style={styles.logoLabel}>โลโก้หน่วยงาน</Text>
        </View>
        <Text style={styles.heading}>รายงานการประชุม {committee}</Text>
        <Text style={styles.center}>ครั้งที่ {session}</Text>
        <Text style={styles.center}>เมื่อ {date}</Text>
        <Text style={styles.center}>ณ {place}</Text>
        <View style={styles.rule} />

        <View style={styles.block}>
          <Text>ผู้มาประชุม</Text>
          {attendees.map((item, i) => (
            <Text key={i} style={styles.listItem}>
              {toThaiNumber(i + 1)}. {item}
            </Text>
          ))}
        </View>
        {absentees.length ? (
          <View style={styles.block}>
            <Text>ผู้ไม่มาประชุม</Text>
            {absentees.map((item, i) => (
              <Text key={i} style={styles.listItem}>
                {toThaiNumber(i + 1)}. {item}
              </Text>
            ))}
          </View>
        ) : null}
        {participants.length ? (
          <View style={styles.block}>
            <Text>ผู้เข้าร่วมประชุม</Text>
            {participants.map((item, i) => (
              <Text key={i} style={styles.listItem}>
                {toThaiNumber(i + 1)}. {item}
              </Text>
            ))}
          </View>
        ) : null}

        <Text style={styles.block}>เริ่มประชุมเวลา {startTime || "…"} น.</Text>

        {agendas.map((a, i) => (
          <View key={i} style={styles.agenda} wrap={false}>
            <Text>
              ระเบียบวาระที่ {toThaiNumber(i + 1)} {insertThaiWordBreaks(toThaiNumber(a.title))}
            </Text>
            {a.body.trim() ? (
              <Text style={styles.paragraph}>{insertThaiWordBreaks(toThaiNumber(a.body))}</Text>
            ) : null}
            {a.resolution.trim() ? (
              <Text style={styles.paragraph}>
                มติที่ประชุม {insertThaiWordBreaks(toThaiNumber(a.resolution))}
              </Text>
            ) : null}
          </View>
        ))}

        <Text style={styles.block}>เลิกประชุมเวลา {endTime || "…"} น.</Text>

        <View style={styles.signBlock} wrap={false}>
          <View style={styles.signSpace} />
          {recorder ? <Text>({recorder})</Text> : null}
          <Text>ผู้จดรายงานการประชุม</Text>
        </View>
      </Page>
    </Document>
  );
}
