/** Domain constants (SQLite stores these as strings) */
export const MembershipRole = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MEMBER: "MEMBER",
} as const;
export type MembershipRole = (typeof MembershipRole)[keyof typeof MembershipRole];

export const DocumentType = {
  EXTERNAL: "EXTERNAL",
  INTERNAL: "INTERNAL",
  STAMP: "STAMP",
  ORDER: "ORDER",
  ANNOUNCE: "ANNOUNCE",
  CERT: "CERT",
  MEETING: "MEETING",
} as const;
export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

export const DocumentStatus = {
  DRAFT: "DRAFT",
  FINAL: "FINAL",
} as const;
export type DocumentStatus = (typeof DocumentStatus)[keyof typeof DocumentStatus];
