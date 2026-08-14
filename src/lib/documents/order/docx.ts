import type { OrderLetterPayload } from "@/lib/documents/order/schema";
import { buildCenteredOfficialDocx } from "@/lib/documents/official-docx";

export async function buildOrderDocx(data: OrderLetterPayload): Promise<Buffer> {
  return buildCenteredOfficialDocx({
    urgency: data.urgency,
    heading: `คำสั่ง${data.issuer}`,
    docNum: data.docNum,
    subject: data.subject,
    paragraphs: data.paragraphs,
    dateLabel: "สั่ง ณ วันที่",
    date: data.date,
    signName: data.signName,
    position: data.position,
  });
}
