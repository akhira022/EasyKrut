import { DocumentStatus, DocumentType } from "@/lib/constants";

export function documentTypeLabel(type: string): string {
  switch (type) {
    case DocumentType.EXTERNAL:
      return "ภายนอก";
    case DocumentType.INTERNAL:
      return "ภายใน";
    case DocumentType.STAMP:
      return "ประทับตรา";
    case DocumentType.ORDER:
      return "คำสั่ง";
    case DocumentType.ANNOUNCE:
      return "ประกาศ";
    case DocumentType.CERT:
      return "รับรอง";
    case DocumentType.MEETING:
      return "รายงานการประชุม";
    default:
      return type;
  }
}

export function documentStatusLabel(status: string): string {
  return status === DocumentStatus.FINAL ? "สมบูรณ์" : "ร่าง";
}

export function membershipRoleLabel(role: string): string {
  switch (role) {
    case "OWNER":
      return "เจ้าของ";
    case "ADMIN":
      return "ผู้ดูแล";
    case "MEMBER":
      return "สมาชิก";
    default:
      return role;
  }
}
