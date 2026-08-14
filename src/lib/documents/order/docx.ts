import type { OrderLetterPayload } from "@/lib/documents/order/schema";
import { orderHeading } from "@/lib/documents/order/schema";
import { buildCenteredOfficialDocx } from "@/lib/documents/official-docx";

export async function buildOrderDocx(data: OrderLetterPayload): Promise<Buffer> {
  return buildCenteredOfficialDocx({
    urgency: data.urgency,
    heading: orderHeading(data.issuer),
    docNum: data.docNum,
    subject: data.subject,
    paragraphs: data.paragraphs,
    effectiveFrom: data.effectiveFrom,
    dateLabel: "สั่ง ณ วันที่",
    date: data.date,
    signName: data.signName,
    position: data.position,
    separator: true,
    variant: "order",
  });
}
