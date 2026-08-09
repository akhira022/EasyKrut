import Link from "next/link";
import { documentStatusLabel, documentTypeLabel } from "@/lib/documents/labels";
import { getPlan } from "@/lib/entitlements";
import { requireOrgContext } from "@/lib/org-context";
import { prisma } from "@/lib/db";

export default async function DashboardPage() {
  const ctx = await requireOrgContext();
  const plan = getPlan(ctx.organization.planKey);
  const recent = await prisma.document.findMany({
    where: { organizationId: ctx.organization.id },
    orderBy: { updatedAt: "desc" },
    take: 5,
    include: { createdBy: { select: { name: true } } },
  });
  const template = await prisma.orgTemplate.findUnique({
    where: { organizationId: ctx.organization.id },
  });
  const hasTemplateBasics = Boolean(
    template &&
      (template.agencyName || template.department) &&
      (template.tel || template.email || template.agencyAddress),
  );
  const memberCount = ctx.memberCount;
  const isEmpty = recent.length === 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium">แดชบอร์ด</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            {ctx.organization.name} · แผน {plan.name}
          </p>
        </div>
        <Link href="/documents/new" className="btn-primary">
          + สร้างเอกสาร
        </Link>
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
            {memberCount}
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

      {isEmpty ? (
        <section className="rounded-xl border border-[var(--border-color)] bg-white p-6 space-y-5">
          <div>
            <h2 className="font-medium text-lg">เริ่มต้นใช้งานใน 3 ขั้น</h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              ทำตามลำดับนี้เพื่อสร้างหนังสือราชการฉบับแรกของหน่วยงาน
            </p>
          </div>
          <ol className="space-y-3">
            <li className="flex gap-3 items-start">
              <span
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm ${
                  hasTemplateBasics
                    ? "bg-green-100 text-green-800"
                    : "bg-[#eeeaff] text-[var(--primary-color)]"
                }`}
              >
                {hasTemplateBasics ? "✓" : "1"}
              </span>
              <div>
                <p className="font-medium text-sm">ตั้งค่าเทมเพลตหน่วยงาน</p>
                <p className="text-sm text-[var(--text-muted)]">
                  ชื่อส่วนราชการ ที่อยู่ โทร อีเมล — จะเติมให้อัตโนมัติตอนสร้างเอกสาร
                </p>
                {!hasTemplateBasics ? (
                  <Link
                    href="/org/settings"
                    className="inline-block mt-2 text-sm text-[var(--primary-color)] hover:underline"
                  >
                    ไปตั้งค่าหน่วยงาน
                  </Link>
                ) : null}
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eeeaff] text-[var(--primary-color)] text-sm">
                2
              </span>
              <div>
                <p className="font-medium text-sm">เลือกประเภทแล้วสร้างหนังสือ</p>
                <p className="text-sm text-[var(--text-muted)]">
                  หนังสือภายนอก (ตราครุฑ) หรือหนังสือภายใน (บันทึกข้อความ)
                </p>
                <Link
                  href="/documents/new"
                  className="inline-block mt-2 text-sm text-[var(--primary-color)] hover:underline"
                >
                  เลือกประเภทเอกสาร
                </Link>
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eeeaff] text-[var(--primary-color)] text-sm">
                3
              </span>
              <div>
                <p className="font-medium text-sm">บันทึกและส่งออก</p>
                <p className="text-sm text-[var(--text-muted)]">
                  บันทึกร่าง / ทำเครื่องหมายสมบูรณ์ แล้วส่งออก PDF หรือ Word
                </p>
              </div>
            </li>
          </ol>
          {memberCount < 2 ? (
            <p className="text-sm text-[var(--text-muted)] border-t border-[var(--border-color)] pt-4">
              ทำงานเป็นทีม?{" "}
              <Link href="/org/settings" className="text-[var(--primary-color)] hover:underline">
                เชิญสมาชิกเข้าหน่วยงาน
              </Link>
            </p>
          ) : null}
        </section>
      ) : (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium">เอกสารล่าสุด</h2>
            <Link href="/documents" className="text-sm text-[var(--primary-color)]">
              ดูทั้งหมด
            </Link>
          </div>
          <div className="rounded-xl border border-[var(--border-color)] bg-white divide-y">
            {recent.map((doc) => (
              <Link
                key={doc.id}
                href={`/documents/${doc.id}`}
                className="flex items-center justify-between gap-3 p-4 hover:bg-[#faf9ff]"
              >
                <div>
                  <div className="font-medium text-sm">{doc.title}</div>
                  <div className="text-xs text-[var(--text-muted)]">
                    {doc.createdBy.name} · {documentStatusLabel(doc.status)} ·{" "}
                    {doc.updatedAt.toLocaleString("th-TH")}
                  </div>
                </div>
                <span className="text-xs rounded-full bg-[#eeeaff] text-[var(--primary-color)] px-2 py-1">
                  {documentTypeLabel(doc.type)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
