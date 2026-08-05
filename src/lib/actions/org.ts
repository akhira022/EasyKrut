"use server";

import { MembershipRole } from "@/lib/constants";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canInviteMember } from "@/lib/entitlements";
import { appBaseUrl, sendMail } from "@/lib/mail";
import { requireOrgContext } from "@/lib/org-context";
import type { ActionResult } from "@/lib/actions/auth";

const inviteSchema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export async function inviteMemberAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const ctx = await requireOrgContext([
      MembershipRole.OWNER,
      MembershipRole.ADMIN,
    ]);

    const parsed = inviteSchema.safeParse({
      email: formData.get("email"),
      role: formData.get("role") || "MEMBER",
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message };
    }

    const gate = canInviteMember({
      planKey: ctx.organization.planKey,
      seatLimit: ctx.organization.seatLimit,
      docLimitMonthly: ctx.organization.docLimitMonthly,
      memberCount: ctx.memberCount,
      docsCreatedThisMonth: ctx.docsCreatedThisMonth,
    });
    if (!gate.ok) {
      return { ok: false, error: gate.reason };
    }

    const email = parsed.data.email.toLowerCase().trim();
    const existingMember = await prisma.membership.findFirst({
      where: {
        organizationId: ctx.organization.id,
        user: { email },
      },
    });
    if (existingMember) {
      return { ok: false, error: "ผู้ใช้นี้อยู่ในหน่วยงานแล้ว" };
    }

    const pendingInvite = await prisma.invitation.findFirst({
      where: {
        organizationId: ctx.organization.id,
        email,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (pendingInvite) {
      return { ok: false, error: "มีคำเชิญค้างสำหรับอีเมลนี้แล้ว" };
    }

    const token = nanoid(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.invitation.create({
      data: {
        organizationId: ctx.organization.id,
        email,
        role: parsed.data.role,
        token,
        expiresAt,
      },
    });

    const inviteUrl = `${appBaseUrl()}/invite/${token}`;
    await sendMail({
      to: email,
      subject: `คำเชิญเข้าร่วม ${ctx.organization.name}`,
      text: [
        `คุณได้รับคำเชิญเข้าร่วมหน่วยงาน ${ctx.organization.name}`,
        "",
        "เปิดลิงก์นี้เพื่อรับคำเชิญ:",
        inviteUrl,
        "",
        "ลิงก์หมดอายุใน 7 วัน",
      ].join("\n"),
    });

    revalidatePath("/org/settings");

    return {
      ok: true,
      message: `สร้างคำเชิญแล้ว — ลิงก์: ${inviteUrl}`,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    if (msg === "UNAUTHORIZED") return { ok: false, error: "กรุณาเข้าสู่ระบบ" };
    if (msg === "FORBIDDEN") return { ok: false, error: "ไม่มีสิทธิ์เชิญสมาชิก" };
    return { ok: false, error: "เชิญสมาชิกไม่สำเร็จ" };
  }
}

const acceptSchema = z.object({
  token: z.string().min(10),
  name: z.string().min(2),
  password: z.string().min(6),
});

async function seatGateForOrg(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
  });
  if (!org) {
    return { ok: false as const, reason: "ไม่พบหน่วยงาน" };
  }
  const memberCount = await prisma.membership.count({
    where: { organizationId },
  });
  return canInviteMember({
    planKey: org.planKey,
    seatLimit: org.seatLimit,
    docLimitMonthly: org.docLimitMonthly,
    memberCount,
    docsCreatedThisMonth: 0,
  });
}

export async function acceptInviteRegisterAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { hash } = await import("bcryptjs");
  const { signIn } = await import("@/lib/auth");
  const { AuthError } = await import("next-auth");

  const parsed = acceptSchema.safeParse({
    token: formData.get("token"),
    name: formData.get("name"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }

  const invitation = await prisma.invitation.findUnique({
    where: { token: parsed.data.token },
  });
  if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) {
    return { ok: false, error: "คำเชิญหมดอายุหรือไม่ถูกต้อง" };
  }

  const existing = await prisma.user.findUnique({
    where: { email: invitation.email },
  });
  if (existing) {
    return {
      ok: false,
      error: "มีบัญชีนี้อยู่แล้ว — เข้าสู่ระบบแล้วเปิดลิงก์เชิญอีกครั้ง",
    };
  }

  const gate = await seatGateForOrg(invitation.organizationId);
  if (!gate.ok) {
    return { ok: false, error: gate.reason };
  }

  const passwordHash = await hash(parsed.data.password, 10);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: invitation.email,
        name: parsed.data.name.trim(),
        passwordHash,
      },
    });
    await tx.membership.create({
      data: {
        userId: user.id,
        organizationId: invitation.organizationId,
        role: invitation.role,
      },
    });
    await tx.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    });
  });

  try {
    await signIn("credentials", {
      email: invitation.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: "รับคำเชิญสำเร็จ แต่เข้าสู่ระบบไม่สำเร็จ" };
    }
    throw error;
  }

  return { ok: true };
}

const acceptLoggedInSchema = z.object({
  token: z.string().min(10),
});

export async function acceptInviteLoggedInAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return { ok: false, error: "กรุณาเข้าสู่ระบบ" };
  }

  const parsed = acceptLoggedInSchema.safeParse({
    token: formData.get("token"),
  });
  if (!parsed.success) {
    return { ok: false, error: "คำเชิญไม่ถูกต้อง" };
  }

  const invitation = await prisma.invitation.findUnique({
    where: { token: parsed.data.token },
  });
  if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) {
    return { ok: false, error: "คำเชิญหมดอายุหรือไม่ถูกต้อง" };
  }

  const sessionEmail = session.user.email.toLowerCase().trim();
  if (sessionEmail !== invitation.email.toLowerCase().trim()) {
    return { ok: false, error: "อีเมลในบัญชีไม่ตรงกับคำเชิญ" };
  }

  const existingMember = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: invitation.organizationId,
      },
    },
  });
  if (existingMember) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    });
    revalidatePath("/dashboard");
    redirect("/dashboard");
  }

  const gate = await seatGateForOrg(invitation.organizationId);
  if (!gate.ok) {
    return { ok: false, error: gate.reason };
  }

  await prisma.$transaction(async (tx) => {
    await tx.membership.create({
      data: {
        userId: session.user.id,
        organizationId: invitation.organizationId,
        role: invitation.role,
      },
    });
    await tx.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    });
  });

  revalidatePath("/dashboard");
  revalidatePath("/org/settings");
  redirect("/dashboard");
}

const templateSchema = z.object({
  agencyName: z.string(),
  agencyAddress: z.string(),
  contactUnit: z.string(),
  docNumPrefix: z.string(),
  tel: z.string(),
  fax: z.string(),
  email: z.string(),
});

export async function updateOrgTemplateAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const ctx = await requireOrgContext([
      MembershipRole.OWNER,
      MembershipRole.ADMIN,
    ]);
    const parsed = templateSchema.safeParse({
      agencyName: formData.get("agencyName") ?? "",
      agencyAddress: formData.get("agencyAddress") ?? "",
      contactUnit: formData.get("contactUnit") ?? "",
      docNumPrefix: formData.get("docNumPrefix") ?? "",
      tel: formData.get("tel") ?? "",
      fax: formData.get("fax") ?? "",
      email: formData.get("email") ?? "",
    });
    if (!parsed.success) {
      return { ok: false, error: "ข้อมูลไม่ถูกต้อง" };
    }

    const data = {
      ...parsed.data,
      // Keep legacy column in sync for older rows / tooling
      department: parsed.data.agencyName,
    };

    await prisma.orgTemplate.upsert({
      where: { organizationId: ctx.organization.id },
      create: { organizationId: ctx.organization.id, ...data },
      update: data,
    });

    return { ok: true };
  } catch {
    return { ok: false, error: "บันทึกเทมเพลตไม่สำเร็จ" };
  }
}
