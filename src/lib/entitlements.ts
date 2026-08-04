export type PlanKey = "free" | "pro" | "business";

export type PlanDefinition = {
  key: PlanKey;
  name: string;
  seatLimit: number;
  docLimitMonthly: number;
  exportPdf: boolean;
  exportWord: boolean;
  priceMonthlyThb: number;
};

export const PLAN_DEFINITIONS: Record<PlanKey, PlanDefinition> = {
  free: {
    key: "free",
    name: "Free",
    seatLimit: 3,
    docLimitMonthly: 20,
    exportPdf: true,
    exportWord: true,
    priceMonthlyThb: 0,
  },
  pro: {
    key: "pro",
    name: "Pro",
    seatLimit: 15,
    docLimitMonthly: 200,
    exportPdf: true,
    exportWord: true,
    priceMonthlyThb: 990,
  },
  business: {
    key: "business",
    name: "Business",
    seatLimit: 50,
    docLimitMonthly: 99999,
    exportPdf: true,
    exportWord: true,
    priceMonthlyThb: 2990,
  },
};

export function getPlan(planKey: string): PlanDefinition {
  if (planKey in PLAN_DEFINITIONS) {
    return PLAN_DEFINITIONS[planKey as PlanKey];
  }
  return PLAN_DEFINITIONS.free;
}

export type OrgEntitlementInput = {
  planKey: string;
  seatLimit: number;
  docLimitMonthly: number;
  memberCount: number;
  docsCreatedThisMonth: number;
};

export function canInviteMember(org: OrgEntitlementInput): {
  ok: boolean;
  reason?: string;
} {
  const plan = getPlan(org.planKey);
  const limit = org.seatLimit || plan.seatLimit;
  if (org.memberCount >= limit) {
    return {
      ok: false,
      reason: `แผน ${plan.name} รองรับได้สูงสุด ${limit} ที่นั่ง — อัปเกรดเพื่อเพิ่มสมาชิก`,
    };
  }
  return { ok: true };
}

export function canCreateDocument(org: OrgEntitlementInput): {
  ok: boolean;
  reason?: string;
} {
  const plan = getPlan(org.planKey);
  const limit = org.docLimitMonthly || plan.docLimitMonthly;
  if (org.docsCreatedThisMonth >= limit) {
    return {
      ok: false,
      reason: `แผน ${plan.name} สร้างเอกสารได้ ${limit} ฉบับ/เดือน — อัปเกรดเพื่อสร้างต่อ`,
    };
  }
  return { ok: true };
}

export function canExportWord(org: { planKey: string }): {
  ok: boolean;
  reason?: string;
} {
  const plan = getPlan(org.planKey);
  if (!plan.exportWord) {
    return { ok: false, reason: "แผนปัจจุบันยังไม่รองรับ Export Word" };
  }
  return { ok: true };
}

export function canExportPdf(org: { planKey: string }): {
  ok: boolean;
  reason?: string;
} {
  const plan = getPlan(org.planKey);
  if (!plan.exportPdf) {
    return { ok: false, reason: "แผนปัจจุบันยังไม่รองรับ Export PDF" };
  }
  return { ok: true };
}
