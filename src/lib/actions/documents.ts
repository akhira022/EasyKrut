"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  emptyExternalLetter,
  externalLetterSchema,
} from "@/lib/documents/external/schema";
import {
  emptyInternalLetter,
  internalLetterSchema,
} from "@/lib/documents/internal/schema";
import {
  emptyStampLetter,
  stampDocumentTitle,
  stampLetterSchema,
} from "@/lib/documents/stamp/schema";
import { stringifyPayload } from "@/lib/documents/payload";
import { DocumentStatus, DocumentType } from "@/lib/constants";
import { canCreateDocument } from "@/lib/entitlements";
import { prisma } from "@/lib/db";
import { requireOrgContext } from "@/lib/org-context";

export type DocActionResult = {
  ok: boolean;
  error?: string;
  documentId?: string;
};

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function incrementDocUsage(tx: Tx, organizationId: string, yearMonth: string) {
  await tx.usageMeter.upsert({
    where: {
      organizationId_yearMonth: { organizationId, yearMonth },
    },
    create: { organizationId, yearMonth, docsCreated: 1 },
    update: { docsCreated: { increment: 1 } },
  });
}

export async function createExternalDocumentAction(): Promise<DocActionResult> {
  try {
    const ctx = await requireOrgContext();
    const gate = canCreateDocument({
      planKey: ctx.organization.planKey,
      seatLimit: ctx.organization.seatLimit,
      docLimitMonthly: ctx.organization.docLimitMonthly,
      memberCount: ctx.memberCount,
      docsCreatedThisMonth: ctx.docsCreatedThisMonth,
    });
    if (!gate.ok) {
      return { ok: false, error: gate.reason };
    }

    const template = await prisma.orgTemplate.findUnique({
      where: { organizationId: ctx.organization.id },
    });

    const payload = emptyExternalLetter();
    if (template) {
      payload.agencyName = template.agencyName || template.department;
      payload.agencyAddress = template.agencyAddress;
      payload.contactUnit =
        template.contactUnit || template.agencyName || template.department;
      payload.docNum = template.docNumPrefix;
      payload.tel = template.tel;
      payload.fax = template.fax;
      payload.email = template.email;
    }

    const doc = await prisma.$transaction(async (tx) => {
      const created = await tx.document.create({
        data: {
          organizationId: ctx.organization.id,
          createdById: ctx.user.id!,
          type: DocumentType.EXTERNAL,
          title: "หนังสือภายนอก (ฉบับร่าง)",
          status: DocumentStatus.DRAFT,
          payload: stringifyPayload(payload),
        },
      });
      await incrementDocUsage(tx, ctx.organization.id, ctx.yearMonth);
      return created;
    });

    revalidatePath("/documents");
    revalidatePath("/dashboard");
    return { ok: true, documentId: doc.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "UNAUTHORIZED") return { ok: false, error: "กรุณาเข้าสู่ระบบ" };
    return { ok: false, error: "สร้างเอกสารไม่สำเร็จ" };
  }
}

export async function createInternalDocumentAction(): Promise<DocActionResult> {
  try {
    const ctx = await requireOrgContext();
    const gate = canCreateDocument({
      planKey: ctx.organization.planKey,
      seatLimit: ctx.organization.seatLimit,
      docLimitMonthly: ctx.organization.docLimitMonthly,
      memberCount: ctx.memberCount,
      docsCreatedThisMonth: ctx.docsCreatedThisMonth,
    });
    if (!gate.ok) {
      return { ok: false, error: gate.reason };
    }

    const template = await prisma.orgTemplate.findUnique({
      where: { organizationId: ctx.organization.id },
    });

    const payload = emptyInternalLetter();
    if (template) {
      payload.agencyName = template.agencyName || template.department;
      payload.docNum = template.docNumPrefix;
    }

    const doc = await prisma.$transaction(async (tx) => {
      const created = await tx.document.create({
        data: {
          organizationId: ctx.organization.id,
          createdById: ctx.user.id!,
          type: DocumentType.INTERNAL,
          title: "หนังสือภายใน (ฉบับร่าง)",
          status: DocumentStatus.DRAFT,
          payload: stringifyPayload(payload),
        },
      });
      await incrementDocUsage(tx, ctx.organization.id, ctx.yearMonth);
      return created;
    });

    revalidatePath("/documents");
    revalidatePath("/dashboard");
    return { ok: true, documentId: doc.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "UNAUTHORIZED") return { ok: false, error: "กรุณาเข้าสู่ระบบ" };
    return { ok: false, error: "สร้างเอกสารไม่สำเร็จ" };
  }
}

export async function createStampDocumentAction(): Promise<DocActionResult> {
  try {
    const ctx = await requireOrgContext();
    const gate = canCreateDocument({
      planKey: ctx.organization.planKey,
      seatLimit: ctx.organization.seatLimit,
      docLimitMonthly: ctx.organization.docLimitMonthly,
      memberCount: ctx.memberCount,
      docsCreatedThisMonth: ctx.docsCreatedThisMonth,
    });
    if (!gate.ok) {
      return { ok: false, error: gate.reason };
    }

    const template = await prisma.orgTemplate.findUnique({
      where: { organizationId: ctx.organization.id },
    });

    const payload = emptyStampLetter();
    if (template) {
      payload.docNum = template.docNumPrefix;
      payload.senderAgency = template.agencyName || template.department;
      payload.contactUnit =
        template.contactUnit || template.agencyName || template.department;
      payload.tel = template.tel;
      payload.address = template.agencyAddress;
    }

    const doc = await prisma.$transaction(async (tx) => {
      const created = await tx.document.create({
        data: {
          organizationId: ctx.organization.id,
          createdById: ctx.user.id!,
          type: DocumentType.STAMP,
          title: "หนังสือประทับตรา (ฉบับร่าง)",
          status: DocumentStatus.DRAFT,
          payload: stringifyPayload(payload),
        },
      });
      await incrementDocUsage(tx, ctx.organization.id, ctx.yearMonth);
      return created;
    });

    revalidatePath("/documents");
    revalidatePath("/dashboard");
    return { ok: true, documentId: doc.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "UNAUTHORIZED") return { ok: false, error: "กรุณาเข้าสู่ระบบ" };
    return { ok: false, error: "สร้างเอกสารไม่สำเร็จ" };
  }
}

const saveExternalSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["DRAFT", "FINAL"]),
  payload: externalLetterSchema,
});

export async function saveDocumentAction(
  input: z.infer<typeof saveExternalSchema>,
): Promise<DocActionResult> {
  try {
    const ctx = await requireOrgContext();
    const parsed = saveExternalSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: "ข้อมูลเอกสารไม่ถูกต้อง" };
    }

    const existing = await prisma.document.findFirst({
      where: {
        id: parsed.data.id,
        organizationId: ctx.organization.id,
        type: DocumentType.EXTERNAL,
      },
    });
    if (!existing) {
      return { ok: false, error: "ไม่พบเอกสาร" };
    }

    const title =
      parsed.data.payload.subject.trim() ||
      existing.title ||
      "หนังสือภายนอก (ฉบับร่าง)";

    await prisma.document.update({
      where: { id: existing.id },
      data: {
        title,
        status: parsed.data.status,
        payload: stringifyPayload(parsed.data.payload),
      },
    });

    revalidatePath(`/documents/${existing.id}`);
    revalidatePath("/documents");
    return { ok: true, documentId: existing.id };
  } catch {
    return { ok: false, error: "บันทึกไม่สำเร็จ" };
  }
}

const saveInternalSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["DRAFT", "FINAL"]),
  payload: internalLetterSchema,
});

export async function saveInternalDocumentAction(
  input: z.infer<typeof saveInternalSchema>,
): Promise<DocActionResult> {
  try {
    const ctx = await requireOrgContext();
    const parsed = saveInternalSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: "ข้อมูลเอกสารไม่ถูกต้อง" };
    }

    const existing = await prisma.document.findFirst({
      where: {
        id: parsed.data.id,
        organizationId: ctx.organization.id,
        type: DocumentType.INTERNAL,
      },
    });
    if (!existing) {
      return { ok: false, error: "ไม่พบเอกสาร" };
    }

    const title =
      parsed.data.payload.subject.trim() ||
      existing.title ||
      "หนังสือภายใน (ฉบับร่าง)";

    await prisma.document.update({
      where: { id: existing.id },
      data: {
        title,
        status: parsed.data.status,
        payload: stringifyPayload(parsed.data.payload),
      },
    });

    revalidatePath(`/documents/${existing.id}`);
    revalidatePath("/documents");
    return { ok: true, documentId: existing.id };
  } catch {
    return { ok: false, error: "บันทึกไม่สำเร็จ" };
  }
}

const saveStampSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["DRAFT", "FINAL"]),
  payload: stampLetterSchema,
});

export async function saveStampDocumentAction(
  input: z.infer<typeof saveStampSchema>,
): Promise<DocActionResult> {
  try {
    const ctx = await requireOrgContext();
    const parsed = saveStampSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: "ข้อมูลเอกสารไม่ถูกต้อง" };
    }

    const existing = await prisma.document.findFirst({
      where: {
        id: parsed.data.id,
        organizationId: ctx.organization.id,
        type: DocumentType.STAMP,
      },
    });
    if (!existing) {
      return { ok: false, error: "ไม่พบเอกสาร" };
    }

    const title = stampDocumentTitle(
      parsed.data.payload,
      existing.title || "หนังสือประทับตรา (ฉบับร่าง)",
    );

    await prisma.document.update({
      where: { id: existing.id },
      data: {
        title,
        status: parsed.data.status,
        payload: stringifyPayload(parsed.data.payload),
      },
    });

    revalidatePath(`/documents/${existing.id}`);
    revalidatePath("/documents");
    return { ok: true, documentId: existing.id };
  } catch {
    return { ok: false, error: "บันทึกไม่สำเร็จ" };
  }
}

export async function duplicateDocumentAction(
  sourceId: string,
): Promise<DocActionResult> {
  try {
    const ctx = await requireOrgContext();
    const gate = canCreateDocument({
      planKey: ctx.organization.planKey,
      seatLimit: ctx.organization.seatLimit,
      docLimitMonthly: ctx.organization.docLimitMonthly,
      memberCount: ctx.memberCount,
      docsCreatedThisMonth: ctx.docsCreatedThisMonth,
    });
    if (!gate.ok) {
      return { ok: false, error: gate.reason };
    }

    const source = await prisma.document.findFirst({
      where: { id: sourceId, organizationId: ctx.organization.id },
    });
    if (!source) {
      return { ok: false, error: "ไม่พบเอกสารต้นฉบับ" };
    }

    const titleBase = source.title.replace(/\s*\(สำเนา\)\s*$/, "").trim();
    const title = `${titleBase || "เอกสาร"} (สำเนา)`;

    const doc = await prisma.$transaction(async (tx) => {
      const created = await tx.document.create({
        data: {
          organizationId: ctx.organization.id,
          createdById: ctx.user.id!,
          type: source.type,
          title,
          status: DocumentStatus.DRAFT,
          payload: source.payload,
        },
      });
      await incrementDocUsage(tx, ctx.organization.id, ctx.yearMonth);
      return created;
    });

    revalidatePath("/documents");
    revalidatePath("/dashboard");
    return { ok: true, documentId: doc.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "UNAUTHORIZED") return { ok: false, error: "กรุณาเข้าสู่ระบบ" };
    return { ok: false, error: "คัดลอกเอกสารไม่สำเร็จ" };
  }
}

export async function deleteDocumentAction(id: string): Promise<DocActionResult> {
  try {
    const ctx = await requireOrgContext();
    const existing = await prisma.document.findFirst({
      where: { id, organizationId: ctx.organization.id },
    });
    if (!existing) return { ok: false, error: "ไม่พบเอกสาร" };

    const isAdmin =
      ctx.membership.role === "OWNER" || ctx.membership.role === "ADMIN";
    if (!isAdmin && existing.createdById !== ctx.user.id) {
      return { ok: false, error: "ไม่มีสิทธิ์ลบเอกสารนี้" };
    }

    await prisma.document.delete({ where: { id } });
    revalidatePath("/documents");
    return { ok: true };
  } catch {
    return { ok: false, error: "ลบไม่สำเร็จ" };
  }
}

export async function recordExportAction(documentId: string): Promise<void> {
  try {
    const ctx = await requireOrgContext();
    const doc = await prisma.document.findFirst({
      where: { id: documentId, organizationId: ctx.organization.id },
    });
    if (!doc) return;

    await prisma.usageMeter.upsert({
      where: {
        organizationId_yearMonth: {
          organizationId: ctx.organization.id,
          yearMonth: ctx.yearMonth,
        },
      },
      create: {
        organizationId: ctx.organization.id,
        yearMonth: ctx.yearMonth,
        exportsCount: 1,
      },
      update: { exportsCount: { increment: 1 } },
    });
  } catch {
    // non-blocking
  }
}
