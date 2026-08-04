"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  emptyExternalLetter,
  externalLetterSchema,
} from "@/lib/documents/external/schema";
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
      payload.department = template.department;
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

      await tx.usageMeter.upsert({
        where: {
          organizationId_yearMonth: {
            organizationId: ctx.organization.id,
            yearMonth: ctx.yearMonth,
          },
        },
        create: {
          organizationId: ctx.organization.id,
          yearMonth: ctx.yearMonth,
          docsCreated: 1,
        },
        update: { docsCreated: { increment: 1 } },
      });

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

const saveSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["DRAFT", "FINAL"]),
  payload: externalLetterSchema,
});

export async function saveDocumentAction(
  input: z.infer<typeof saveSchema>,
): Promise<DocActionResult> {
  try {
    const ctx = await requireOrgContext();
    const parsed = saveSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: "ข้อมูลเอกสารไม่ถูกต้อง" };
    }

    const existing = await prisma.document.findFirst({
      where: {
        id: parsed.data.id,
        organizationId: ctx.organization.id,
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
