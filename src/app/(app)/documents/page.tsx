import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireOrgContext } from "@/lib/org-context";
import { Alert } from "@/components/ui/Alert";
import { DocumentList } from "@/components/documents/DocumentList";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    q?: string;
    from?: string;
    to?: string;
    creatorId?: string;
  }>;
}) {
  const ctx = await requireOrgContext();
  const sp = await searchParams;
  const q = sp.q?.trim();
  const from = sp.from?.trim();
  const to = sp.to?.trim();
  const creatorId = sp.creatorId?.trim();
  const hasFilters = Boolean(q || from || to || creatorId);

  const members = await prisma.membership.findMany({
    where: { organizationId: ctx.organization.id },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (from) {
    const d = new Date(from);
    if (!Number.isNaN(d.getTime())) dateFilter.gte = d;
  }
  if (to) {
    const d = new Date(to);
    if (!Number.isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999);
      dateFilter.lte = d;
    }
  }

  const documents = await prisma.document.findMany({
    where: {
      organizationId: ctx.organization.id,
      ...(q ? { title: { contains: q } } : {}),
      ...(creatorId ? { createdById: creatorId } : {}),
      ...(dateFilter.gte || dateFilter.lte ? { updatedAt: dateFilter } : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: { createdBy: { select: { name: true, id: true } } },
  });

  const isAdmin =
    ctx.membership.role === "OWNER" || ctx.membership.role === "ADMIN";
  const canDeleteIds = documents
    .filter((doc) => isAdmin || doc.createdById === ctx.user.id)
    .map((doc) => doc.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="ประวัติเอกสาร"
        description="เอกสารทั้งหมดในหน่วยงาน"
        action={
          <Link href="/documents/new" className="btn-primary">
            สร้างเอกสาร
          </Link>
        }
      />

      {sp.error ? <Alert tone="error">{sp.error}</Alert> : null}

      <details className="doc-filters rounded-xl border border-[var(--border-color)] bg-white p-4" open={hasFilters}>
        <summary>ตัวกรองและการค้นหา</summary>
        <form className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5 max-w-4xl items-end">
          <div className="form-group mb-0 sm:col-span-2 lg:col-span-2">
            <label htmlFor="filter-q">ค้นหาเรื่อง</label>
            <input
              id="filter-q"
              className="field"
              name="q"
              defaultValue={q}
              placeholder="ชื่อเรื่อง..."
            />
          </div>
          <div className="form-group mb-0">
            <label htmlFor="filter-from">ตั้งแต่วันที่</label>
            <input id="filter-from" className="field" type="date" name="from" defaultValue={from} />
          </div>
          <div className="form-group mb-0">
            <label htmlFor="filter-to">ถึงวันที่</label>
            <input id="filter-to" className="field" type="date" name="to" defaultValue={to} />
          </div>
          <div className="form-group mb-0">
            <label htmlFor="filter-creator">ผู้สร้าง</label>
            <select
              id="filter-creator"
              className="field"
              name="creatorId"
              defaultValue={creatorId ?? ""}
            >
              <option value="">ทั้งหมด</option>
              {members.map((m) => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-5 flex gap-2">
            <button type="submit" className="btn-secondary">
              ค้นหา
            </button>
            <Link href="/documents" className="btn-text">
              ล้างตัวกรอง
            </Link>
          </div>
        </form>
      </details>

      {documents.length === 0 ? (
        <EmptyState
          title={hasFilters ? "ไม่พบเอกสารที่ตรงกับตัวกรอง" : "ยังไม่มีเอกสารในหน่วยงาน"}
          description={
            hasFilters
              ? "ลองล้างตัวกรองหรือค้นหาด้วยคำอื่น"
              : "เลือกประเภทแล้วสร้างฉบับแรกได้เลย"
          }
          action={
            <Link href={hasFilters ? "/documents" : "/documents/new"} className="btn-primary">
              {hasFilters ? "ล้างตัวกรอง" : "สร้างเอกสาร"}
            </Link>
          }
        />
      ) : (
        <DocumentList
          documents={documents.map((doc) => ({
            id: doc.id,
            title: doc.title,
            type: doc.type,
            status: doc.status,
            createdById: doc.createdById,
            createdByName: doc.createdBy.name,
            updatedAt: doc.updatedAt.toLocaleString("th-TH"),
          }))}
          canDeleteIds={canDeleteIds}
        />
      )}

      <div className="rounded-xl border border-dashed border-[var(--border-color)] p-4 text-sm text-[var(--text-muted)] flex flex-wrap items-center justify-between gap-2">
        <span>ระเบียบ ข้อบังคับ แถลงการณ์ และข่าว — เร็วๆ นี้</span>
        <Link href="/documents/new" className="text-[var(--primary-color)] hover:underline">
          ดูประเภทที่สร้างได้
        </Link>
      </div>
    </div>
  );
}
