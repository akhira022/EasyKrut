import { MembershipRole } from "@/lib/constants";
import {
  inviteMemberAction,
  updateOrgTemplateAction,
} from "@/lib/actions/org";
import { BillingActions } from "@/components/billing/BillingActions";
import { getPlan } from "@/lib/entitlements";
import { prisma } from "@/lib/db";
import { membershipRoleLabel } from "@/lib/documents/labels";
import { requireOrgContext } from "@/lib/org-context";
import { isStripeConfigured } from "@/lib/stripe";
import { Alert } from "@/components/ui/Alert";
import { PageHeader } from "@/components/ui/PageHeader";
import { InviteForm } from "./invite-form";
import { TemplateForm } from "./template-form";

export default async function OrgSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>;
}) {
  const ctx = await requireOrgContext();
  const sp = await searchParams;
  const plan = getPlan(ctx.organization.planKey);
  const stripeReady = isStripeConfigured();
  const canManage =
    ctx.membership.role === MembershipRole.OWNER ||
    ctx.membership.role === MembershipRole.ADMIN;

  const [members, invitations, template] = await Promise.all([
    prisma.membership.findMany({
      where: { organizationId: ctx.organization.id },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.invitation.findMany({
      where: {
        organizationId: ctx.organization.id,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.orgTemplate.findUnique({
      where: { organizationId: ctx.organization.id },
    }),
  ]);

  return (
    <div className="space-y-8 max-w-3xl">
      <PageHeader
        title="หน่วยงาน"
        description={`${ctx.organization.name} · แผน ${plan.name}`}
      />

      <nav className="flex flex-wrap gap-2 text-sm" aria-label="ส่วนตั้งค่า">
        <a href="#quota" className="btn-text">โควตา</a>
        <a href="#members" className="btn-text">สมาชิก</a>
        {canManage ? (
          <>
            <a href="#invite" className="btn-text">เชิญสมาชิก</a>
            <a href="#template" className="btn-text">เทมเพลต</a>
          </>
        ) : null}
      </nav>

      {sp.billing === "success" ? (
        <Alert tone="success">
          ชำระเงินสำเร็จแล้ว — แผนของคุณจะอัปเดตเมื่อระบบยืนยันการชำระเงิน
        </Alert>
      ) : null}

      <section id="quota" className="rounded-xl border border-[var(--border-color)] bg-white p-5 space-y-3">
        <h2 className="font-medium">โควตาและการใช้งาน</h2>
        <p className="text-sm text-[var(--text-muted)]">
          สมาชิก {ctx.memberCount}/{ctx.organization.seatLimit} · เอกสารเดือนนี้{" "}
          {ctx.docsCreatedThisMonth}/{ctx.organization.docLimitMonthly} · Export{" "}
          {ctx.exportsThisMonth}
        </p>
        {canManage ? (
          <BillingActions
            stripeReady={stripeReady}
            hasCustomer={Boolean(ctx.organization.stripeCustomerId)}
          />
        ) : null}
        {!stripeReady ? (
          <p className="text-xs text-[var(--text-muted)]">
            การชำระเงินอัตโนมัติยังไม่พร้อม — เมื่อชนลิมิตระบบจะบล็อกและแนะนำอัปเกรดในหน้า
            ราคา
          </p>
        ) : null}
      </section>

      <section id="members" className="rounded-xl border border-[var(--border-color)] bg-white p-5">
        <h2 className="font-medium mb-3">สมาชิก</h2>
        <ul className="divide-y text-sm">
          {members.map((m) => (
            <li key={m.id} className="py-2 flex justify-between gap-3">
              <span>
                {m.user.name}{" "}
                <span className="text-[var(--text-muted)]">({m.user.email})</span>
              </span>
              <span className="text-xs rounded-full bg-[#eeeaff] px-2 py-1 text-[var(--primary-color)]">
                {membershipRoleLabel(m.role)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {canManage ? (
        <>
          <section id="invite" className="rounded-xl border border-[var(--border-color)] bg-white p-5 space-y-4">
            <h2 className="font-medium">เชิญสมาชิก</h2>
            <InviteForm action={inviteMemberAction} />
            {invitations.length > 0 ? (
              <div className="text-sm space-y-2">
                <p className="text-[var(--text-muted)]">คำเชิญที่ยังไม่รับ</p>
                {invitations.map((inv) => (
                  <div key={inv.id} className="rounded-md bg-[#f7f6fb] p-2 break-all">
                    {inv.email} · /invite/{inv.token}
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <section id="template" className="rounded-xl border border-[var(--border-color)] bg-white p-5 space-y-4">
            <h2 className="font-medium">เทมเพลตหน่วยงาน</h2>
            <p className="text-sm text-[var(--text-muted)]">
              ค่าเริ่มต้นตอนสร้างหนังสือภายนอกใหม่
            </p>
            <TemplateForm
              action={updateOrgTemplateAction}
              defaults={{
                agencyName: template?.agencyName || template?.department || "",
                agencyAddress: template?.agencyAddress ?? "",
                contactUnit: template?.contactUnit ?? "",
                docNumPrefix: template?.docNumPrefix ?? "",
                tel: template?.tel ?? "",
                fax: template?.fax ?? "",
                email: template?.email ?? "",
              }}
            />
          </section>
        </>
      ) : null}
    </div>
  );
}
