import type { OrderLetterPayload } from "@/lib/documents/order/schema";
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
      heading={`คำสั่ง${data.issuer}`}
      docNum={data.docNum}
      subject={data.subject}
      paragraphs={data.paragraphs}
      dateLabel="สั่ง ณ วันที่"
      date={data.date}
      signName={data.signName}
      position={data.position}
      className={className}
      printMode={printMode}
    />
  );
}
