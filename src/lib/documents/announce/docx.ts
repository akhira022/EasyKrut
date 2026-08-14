import type { AnnounceLetterPayload } from "@/lib/documents/announce/schema";
import { announceHeading } from "@/lib/documents/announce/schema";
import { buildCenteredOfficialDocx } from "@/lib/documents/official-docx";

export async function buildAnnounceDocx(data: AnnounceLetterPayload): Promise<Buffer> {
  return buildCenteredOfficialDocx({
    urgency: data.urgency,
    heading: announceHeading(data.kind, data.issuer),
    subject: data.subject,
    paragraphs: data.paragraphs,
    dateLabel: `${data.kind} ณ วันที่`,
    date: data.date,
    signName: data.signName,
    position: data.position,
    separator: true,
    variant: "announce",
  });
}
