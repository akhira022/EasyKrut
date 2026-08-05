"use server";

import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPlan } from "@/lib/entitlements";
import { slugifyOrgName } from "@/lib/org-context";

const registerSchema = z.object({
  name: z.string().min(2, "กรุณาระบุชื่อ"),
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(6, "รหัสผ่านอย่างน้อย 6 ตัวอักษร"),
  organizationName: z.string().min(2, "กรุณาระบุชื่อหน่วยงาน"),
});

export type ActionResult = {
  ok: boolean;
  error?: string;
  message?: string;
};

export async function registerAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    organizationName: formData.get("organizationName"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "อีเมลนี้ถูกใช้แล้ว" };
  }

  const passwordHash = await hash(parsed.data.password, 10);
  const plan = getPlan("free");
  const slug = slugifyOrgName(parsed.data.organizationName);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        name: parsed.data.name.trim(),
        passwordHash,
      },
    });

    const org = await tx.organization.create({
      data: {
        name: parsed.data.organizationName.trim(),
        slug,
        planKey: plan.key,
        seatLimit: plan.seatLimit,
        docLimitMonthly: plan.docLimitMonthly,
        template: {
          create: {},
        },
      },
    });

    await tx.membership.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        role: "OWNER",
      },
    });
  });

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: "สมัครสำเร็จ แต่เข้าสู่ระบบไม่สำเร็จ" };
    }
    throw error;
  }

  return { ok: true };
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, error: "กรุณากรอกอีเมลและรหัสผ่าน" };
  }

  const callbackRaw = String(formData.get("callbackUrl") ?? "/dashboard");
  const callbackUrl =
    callbackRaw.startsWith("/") && !callbackRaw.startsWith("//")
      ? callbackRaw
      : "/dashboard";

  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase().trim(),
      password: parsed.data.password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
    }
    throw error;
  }

  return { ok: true };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
