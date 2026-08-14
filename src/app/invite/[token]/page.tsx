import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { membershipRoleLabel } from "@/lib/documents/labels";
import { PublicHeader } from "@/components/nav/PublicHeader";
import { AcceptInviteForm } from "./accept-form";
import { AcceptInviteLoggedInForm } from "./accept-logged-in-form";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { organization: true },
  });

  if (!invitation) {
    return (
      <div className="min-h-screen">
        <PublicHeader />
        <div className="flex items-center justify-center px-4 py-12">
          <div className="auth-card text-center space-y-4">
            <h1 className="text-2xl font-medium">ไม่พบคำเชิญนี้</h1>
            <p className="text-sm text-[var(--text-muted)]">
              ลิงก์อาจไม่ถูกต้อง หรือถูกยกเลิกแล้ว
            </p>
            <Link href="/login" className="btn-primary w-full justify-center">
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (invitation.acceptedAt || invitation.expiresAt < new Date()) {
    return (
      <div className="min-h-screen">
        <PublicHeader />
        <div className="flex items-center justify-center px-4 py-12">
          <div className="auth-card text-center space-y-4">
            <h1 className="text-2xl font-medium">คำเชิญนี้ใช้ไม่ได้แล้ว</h1>
            <p className="text-sm text-[var(--text-muted)]">
              {invitation.acceptedAt
                ? "คำเชิญนี้ถูกรับไปแล้ว"
                : "คำเชิญหมดอายุแล้ว — ขอให้เจ้าของหน่วยงานส่งลิงก์ใหม่"}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/login" className="btn-primary">
                เข้าสู่ระบบ
              </Link>
              <Link href="/" className="btn-secondary">
                หน้าแรก
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const session = await auth();
  const existingUser = await prisma.user.findUnique({
    where: { email: invitation.email },
    select: { id: true },
  });

  const sessionEmail = session?.user?.email?.toLowerCase().trim();
  const inviteEmail = invitation.email.toLowerCase().trim();
  const loggedInAsInvitee = Boolean(session?.user?.id && sessionEmail === inviteEmail);

  return (
    <div className="min-h-screen">
      <PublicHeader />
      <div className="flex items-center justify-center px-4 py-12">
        <div className="auth-card">
          <h1 className="text-2xl font-medium mb-1">รับคำเชิญ</h1>
          <p className="text-sm text-[var(--text-muted)] mb-6">
            เข้าร่วม <strong>{invitation.organization.name}</strong> ในฐานะ{" "}
            {membershipRoleLabel(invitation.role)}
            <br />
            อีเมล: {invitation.email}
          </p>

          {loggedInAsInvitee ? (
            <AcceptInviteLoggedInForm token={token} />
          ) : existingUser ? (
            <div className="space-y-4">
              <p className="text-sm">
                มีบัญชีนี้อยู่แล้ว — เข้าสู่ระบบด้วยอีเมลคำเชิญ แล้วกลับมารับคำเชิญ
              </p>
              {session?.user ? (
                <p className="text-sm text-amber-700">
                  คุณเข้าสู่ระบบด้วยอีเมลอื่นอยู่ กรุณาออกจากระบบแล้วเข้าด้วย {invitation.email}
                </p>
              ) : null}
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`}
                className="btn-primary w-full justify-center"
              >
                เข้าสู่ระบบเพื่อรับคำเชิญ
              </Link>
            </div>
          ) : (
            <AcceptInviteForm token={token} />
          )}
        </div>
      </div>
    </div>
  );
}
