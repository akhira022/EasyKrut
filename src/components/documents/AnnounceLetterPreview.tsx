import type { AnnounceLetterPayload } from "@/lib/documents/announce/schema";
import { CenteredOfficialPreview } from "./CenteredOfficialPreview";

type Props = {
  data: AnnounceLetterPayload;
  className?: string;
  printMode?: boolean;
};

export function AnnounceLetterPreview({ data, className, printMode }: Props) {
  return (
    <CenteredOfficialPreview
      urgency={data.urgency}
      heading={`${data.kind}${data.issuer}`}
      subject={data.subject}
      paragraphs={data.paragraphs}
      dateLabel={`${data.kind} ณ วันที่`}
      date={data.date}
      signName={data.signName}
      position={data.position}
      className={className}
      printMode={printMode}
    />
  );
}
