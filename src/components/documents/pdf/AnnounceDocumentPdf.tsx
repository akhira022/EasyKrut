import { CenteredOfficialPdf } from "./CenteredOfficialPdf";
import type { AnnounceLetterPayload } from "@/lib/documents/announce/schema";
import { announceHeading } from "@/lib/documents/announce/schema";

export function AnnounceDocumentPdf({
  data,
  garudaSrc,
}: {
  data: AnnounceLetterPayload;
  garudaSrc?: string | Buffer;
}) {
  return (
    <CenteredOfficialPdf
      title={data.kind}
      urgency={data.urgency}
      heading={announceHeading(data.kind, data.issuer)}
      subject={data.subject}
      paragraphs={data.paragraphs}
      dateLabel={`${data.kind} ณ วันที่`}
      date={data.date}
      signName={data.signName}
      position={data.position}
      separator
      variant="announce"
      garudaSrc={garudaSrc}
    />
  );
}
