import { MembershipRole } from "@/lib/constants";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { currentYearMonth } from "@/lib/thai";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }
  return session.user;
}

export async function getActiveMembership(userId: string) {
  const membership = await prisma.membership.findFirst({
    where: { userId },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });
  return membership;
}

export async function requireOrgContext(roles?: MembershipRole[]) {
  const user = await requireUser();
  const membership = await getActiveMembership(user.id);
  if (!membership) {
    throw new Error("NO_ORGANIZATION");
  }
  if (roles && !roles.includes(membership.role as MembershipRole)) {
    throw new Error("FORBIDDEN");
  }

  const yearMonth = currentYearMonth();
  const usage = await prisma.usageMeter.findUnique({
    where: {
      organizationId_yearMonth: {
        organizationId: membership.organizationId,
        yearMonth,
      },
    },
  });

  const memberCount = await prisma.membership.count({
    where: { organizationId: membership.organizationId },
  });

  return {
    user,
    membership,
    organization: membership.organization,
    memberCount,
    docsCreatedThisMonth: usage?.docsCreated ?? 0,
    exportsThisMonth: usage?.exportsCount ?? 0,
    yearMonth,
  };
}

export function slugifyOrgName(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9ก-๙]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || "org"}-${suffix}`;
}
