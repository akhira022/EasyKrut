import { DocumentStatus, DocumentType } from "@/lib/constants";

export function documentTypeLabel(type: string): string {
  switch (type) {
    case DocumentType.EXTERNAL:
      return "ภายนอก";
    case DocumentType.INTERNAL:
      return "ภายใน";
    case DocumentType.STAMP:
      return "ประทับตรา";
    case DocumentType.MEETING:
      return "รายงานการประชุม";
    case DocumentType.ORDER:
      return "สั่งการ";
    case DocumentType.CERT:
      return "รับรอง";
    default:
      return type;
  }
}

export function documentStatusLabel(status: string): string {
  return status === DocumentStatus.FINAL ? "สมบูรณ์" : "ร่าง";
}
