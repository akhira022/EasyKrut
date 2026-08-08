import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ExternalLetterPayload } from "@/lib/documents/external/schema";
import { getThaiDate, insertThaiWordBreaks, toThaiNumber } from "@/lib/thai";
import { PDF_FONT_FAMILY } from "./fontFamily";

/** cm → pt (1 in = 2.54 cm = 72 pt) */
const cm = (n: number) => (n / 2.54) * 72;

/** Real bottom margin of the printed page (matches paddingTop/Right/Left below). */
const PAGE_MARGIN_BOTTOM = cm(2);
/**
 * Vertical room reserved, IN NORMAL FLOW, for the absolutely-positioned
 * footer below (contact info — up to ~5 short lines).
 *
 * IMPORTANT (verified empirically against @react-pdf/renderer v4): a
 * `position:'absolute'` view's `bottom`/`left`/`right` offsets are measured
 * from the page's true physical edges, NOT from `Page`'s own padding — so
 * increasing `Page.paddingBottom` does NOT change where the footer renders.
 * Worse, it actively makes pagination *more* eager to push the absolute
 * footer to a new page (its Yoga-computed layout box still counts toward
 * the page's available height even though its final render position
 * ignores the page padding). So the fix is NOT to inflate `page.paddingBottom`
 * — it's to reserve the room with a plain in-flow spacer (see
 * `footerReserveSpace` below, rendered just before the footer) while
 * leaving `Page.paddingBottom` at the real page margin. This keeps normal
 * text from visually running under the footer without ever making
 * pagination worse than before the fix.
 */
const FOOTER_RESERVE = cm(3.5);

const styles = StyleSheet.create({
  page: {
    fontFamily: PDF_FONT_FAMILY,
    fontSize: 16,
    lineHeight: 1.15,
    color: "#000",
    paddingTop: cm(2.5),
    paddingRight: cm(2),
    paddingBottom: PAGE_MARGIN_BOTTOM,
    paddingLeft: cm(3),
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    minHeight: cm(3),
  },
  headerLeft: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: cm(3),
    alignItems: "flex-start",
  },
  headerMid: {
    width: cm(3),
    alignItems: "center",
    justifyContent: "flex-start",
  },
  headerRight: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: cm(3),
    alignItems: "flex-start",
  },
  garuda: {
    width: cm(3),
    height: cm(3),
    objectFit: "contain",
  },
  urgency: {
    color: "#c00",
    fontWeight: 700,
    fontSize: 18,
    marginBottom: 2,
  },
  urgencySpacer: {
    height: 18,
  },
  agencyAddress: {
    // Content width 16cm → 50% + 1.5cm (half of 3cm Garuda) = 9.5cm
    marginLeft: cm(9.5),
    marginTop: 6,
  },
  date: {
    marginLeft: "50%",
    marginTop: 6,
    textAlign: "left",
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
  metaList: {
    marginTop: 6,
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
  closing: {
    textAlign: "left",
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
  /** Plain in-flow spacer reserving room for the absolute footer below. */
  footerReserveSpace: {
    height: FOOTER_RESERVE,
  },
  contact: {
    // Sticks to the bottom of the page it lands on instead of flowing
    // normally — this is what previously caused it to spill onto a second
    // page by itself when combined with a long signature block.
    position: "absolute",
    bottom: PAGE_MARGIN_BOTTOM,
    left: cm(3),
    right: cm(2),
    fontSize: 15,
    lineHeight: 1.3,
  },
  cc: {
    flexDirection: "row",
    marginTop: 6,
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

function MetaRow({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <View style={styles.meta}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function MetaList({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  if (items.length === 1) {
    return <MetaRow label={label} value={items[0]!} />;
  }
  return (
    <View style={styles.metaList}>
      <Text style={styles.metaLabel}>{label}</Text>
      {items.map((item, i) => (
        <Text key={i} style={styles.metaListItem}>
          {toThaiNumber(i + 1)}. {item}
        </Text>
      ))}
    </View>
  );
}

type Props = {
  data: ExternalLetterPayload;
  /**
   * Garuda emblem image source. Prefer passing a `Buffer` (e.g. via
   * `getGarudaImageBuffer()`) when rendering server-side with
   * `renderToBuffer()` — a filesystem path string is unreliable on Windows.
   * A `/public`-relative URL string (default) only works when rendered
   * client-side in the browser.
   */
  garudaSrc?: string | Buffer;
};

export function ExternalDocumentPdf({ data, garudaSrc = "/krut.png" }: Props) {
  const agencyName = toThaiNumber(data.agencyName);
  const agencyAddress = toThaiNumber(data.agencyAddress);
  const docnum = toThaiNumber(data.docNum);
  const date = getThaiDate(data.date);
  const subject = insertThaiWordBreaks(toThaiNumber(data.subject));
  const receiver = insertThaiWordBreaks(toThaiNumber(data.receiver));
  const references = numberedItems(data.references || []);
  const attachments = numberedItems(data.attachments || []);
  const signName = toThaiNumber(data.signName);
  const position = toThaiNumber(data.position);
  const contactUnit = insertThaiWordBreaks(toThaiNumber(data.contactUnit));
  const tel = toThaiNumber(data.tel);
  const fax = toThaiNumber(data.fax);
  const cc = insertThaiWordBreaks(toThaiNumber(data.cc));
  const paragraphs = (data.paragraphs || [])
    .map((p) => toThaiNumber(p).replace(/\s+/g, " ").trim())
    .filter((p) => p !== "")
    .map(insertThaiWordBreaks);

  const agencyNameLines = linesOf(agencyName);
  const agencyAddressLines = linesOf(agencyAddress);
  const positionLines = linesOf(position);

  return (
    <Document title="หนังสือภายนอก" author="EasyKrut">
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {data.urgency ? (
              <Text style={styles.urgency}>{data.urgency}</Text>
            ) : (
              <View style={styles.urgencySpacer} />
            )}
            <Text>ที่ {docnum}</Text>
          </View>
          <View style={styles.headerMid}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image */}
            <Image src={garudaSrc} style={styles.garuda} />
          </View>
          <View style={styles.headerRight}>
            <View style={styles.urgencySpacer} />
            <View>
              {agencyNameLines.map((line, i) => (
                <Text key={i}>{line}</Text>
              ))}
            </View>
          </View>
        </View>

        {agencyAddressLines.length > 0 ? (
          <View style={styles.agencyAddress}>
            {agencyAddressLines.map((line, i) => (
              <Text key={i}>{line}</Text>
            ))}
          </View>
        ) : null}

        {date ? <Text style={styles.date}>{date}</Text> : null}

        <MetaRow label="เรื่อง" value={subject} />
        <MetaRow label={data.salutation} value={receiver} />
        <MetaList label="อ้างถึง" items={references} />
        <MetaList label="สิ่งที่ส่งมาด้วย" items={attachments} />

        <View style={styles.body}>
          {paragraphs.map((p, i) => (
            <Text key={i} style={styles.paragraph}>
              {p}
            </Text>
          ))}
        </View>

        <View style={styles.signatureBlock} wrap={false}>
          <Text style={styles.closing}>{data.closing}</Text>
          <View style={styles.signSpace} />
          {signName ? <Text style={styles.signName}>({signName})</Text> : null}
          {positionLines.map((line, i) => (
            <Text key={i} style={styles.signPosition}>
              {line}
            </Text>
          ))}
        </View>

        <View style={styles.footerReserveSpace} />

        <View style={styles.contact} wrap={false}>
          {contactUnit ? <Text>{contactUnit}</Text> : null}
          {tel ? <Text>โทร. {tel}</Text> : null}
          {fax ? <Text>โทรสาร {fax}</Text> : null}
          {data.email ? <Text>ไปรษณีย์อิเล็กทรอนิกส์ {data.email}</Text> : null}
          {cc ? (
            <View style={styles.cc}>
              <Text style={styles.metaLabel}>สำเนาส่ง</Text>
              <Text>{cc}</Text>
            </View>
          ) : null}
        </View>
      </Page>
    </Document>
  );
}
