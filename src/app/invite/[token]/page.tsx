import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AcceptInviteForm } from "./accept-form";

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

  if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) {
    notFound();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="auth-card">
        <h1 className="text-2xl font-medium mb-1">รับคำเชิญ</h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          เข้าร่วม <strong>{invitation.organization.name}</strong> ในฐานะ {invitation.role}
          <br />
          อีเมล: {invitation.email}
        </p>
        <AcceptInviteForm token={token} />
      </div>
    </div>
  );
}
