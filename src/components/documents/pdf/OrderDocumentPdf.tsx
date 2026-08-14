import { CenteredOfficialPdf } from "./CenteredOfficialPdf";
import type { OrderLetterPayload } from "@/lib/documents/order/schema";
import { orderHeading } from "@/lib/documents/order/schema";

export function OrderDocumentPdf({
  data,
  garudaSrc,
}: {
  data: OrderLetterPayload;
  garudaSrc?: string | Buffer;
}) {
  return (
    <CenteredOfficialPdf
      title="คำสั่ง"
      urgency={data.urgency}
      heading={orderHeading(data.issuer)}
      docNum={data.docNum}
      subject={data.subject}
      paragraphs={data.paragraphs}
      effectiveFrom={data.effectiveFrom}
      dateLabel="สั่ง ณ วันที่"
      date={data.date}
      signName={data.signName}
      position={data.position}
      separator
      variant="order"
      garudaSrc={garudaSrc}
    />
  );
}
