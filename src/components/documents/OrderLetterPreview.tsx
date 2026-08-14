import type { OrderLetterPayload } from "@/lib/documents/order/schema";
import { orderHeading } from "@/lib/documents/order/schema";
import { CenteredOfficialPreview } from "./CenteredOfficialPreview";

type Props = {
  data: OrderLetterPayload;
  className?: string;
  printMode?: boolean;
};

export function OrderLetterPreview({ data, className, printMode }: Props) {
  return (
    <CenteredOfficialPreview
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
      className={className}
      printMode={printMode}
    />
  );
}
