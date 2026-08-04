import Link from "next/link";
import { redirect } from "next/navigation";
import { createExternalDocumentAction } from "@/lib/actions/documents";
import { getPlan } from "@/lib/entitlements";
import { requireOrgContext } from "@/lib/org-context";
import { prisma } from "@/lib/db";

async function createDoc() {
  "use server";
  const result = await createExternalDocumentAction();
  if (result.ok && result.documentId) {
    redirect(`/documents/${result.documentId}`);
  }
  redirect(`/documents?error=${encodeURIComponent(result.error ?? "สร้างไม่สำเร็จ")}`);
}

export default async function DashboardPage() {
  const ctx = await requireOrgContext();
  const plan = getPlan(ctx.organization.planKey);
  const recent = await prisma.document.findMany({
    where: { organizationId: ctx.organization.id },
    orderBy: { updatedAt: "desc" },
    take: 5,
    include: { createdBy: { select: { name: true } } },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium">แดชบอร์ด</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            {ctx.organization.name} · แผน {plan.name}
          </p>
        </div>
        <form action={createDoc}>
          <button type="submit" className="btn-primary">
            + สร้างหนังสือภายนอก
          </button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--border-color)] bg-white p-4">
          <p className="text-xs text-[var(--text-muted)]">เอกสารเดือนนี้</p>
          <p className="text-2xl mt-1">
            {ctx.docsCreatedThisMonth}
            <span className="text-sm text-[var(--text-muted)]">
              {" "}
              / {ctx.organization.docLimitMonthly}
            </span>
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border-color)] bg-white p-4">
          <p className="text-xs text-[var(--text-muted)]">สมาชิก</p>
          <p className="text-2xl mt-1">
            {ctx.memberCount}
            <span className="text-sm text-[var(--text-muted)]">
              {" "}
              / {ctx.organization.seatLimit}
            </span>
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border-color)] bg-white p-4">
          <p className="text-xs text-[var(--text-muted)]">Export เดือนนี้</p>
          <p className="text-2xl mt-1">{ctx.exportsThisMonth}</p>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">เอกสารล่าสุด</h2>
          <Link href="/documents" className="text-sm text-[var(--primary-color)]">
            ดูทั้งหมด
          </Link>
        </div>
        <div className="rounded-xl border border-[var(--border-color)] bg-white divide-y">
          {recent.length === 0 ? (
            <p className="p-4 text-sm text-[var(--text-muted)]">ยังไม่มีเอกสาร</p>
          ) : (
            recent.map((doc) => (
              <Link
                key={doc.id}
                href={`/documents/${doc.id}`}
                className="flex items-center justify-between gap-3 p-4 hover:bg-[#faf9ff]"
              >
                <div>
                  <div className="font-medium text-sm">{doc.title}</div>
                  <div className="text-xs text-[var(--text-muted)]">
                    {doc.createdBy.name} · {doc.status} ·{" "}
                    {doc.updatedAt.toLocaleString("th-TH")}
                  </div>
                </div>
                <span className="text-xs rounded-full bg-[#eeeaff] text-[var(--primary-color)] px-2 py-1">
                  ภายนอก
                </span>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
