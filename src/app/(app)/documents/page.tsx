import Link from "next/link";
import { redirect } from "next/navigation";
import {
  deleteDocumentAction,
  duplicateDocumentAction,
} from "@/lib/actions/documents";
import { documentStatusLabel, documentTypeLabel } from "@/lib/documents/labels";
import { prisma } from "@/lib/db";
import { requireOrgContext } from "@/lib/org-context";

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
      ...(dateFilter.gte || dateFilter.lte
        ? { updatedAt: dateFilter }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: { createdBy: { select: { name: true, id: true } } },
  });

  const isAdmin =
    ctx.membership.role === "OWNER" || ctx.membership.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium">ประวัติเอกสาร</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            เอกสารทั้งหมดในหน่วยงาน
          </p>
        </div>
        <Link href="/documents/new" className="btn-primary">
          + สร้างเอกสาร
        </Link>
      </div>

      {sp.error ? (
        <p className="rounded-md bg-red-50 text-red-700 px-3 py-2 text-sm">{sp.error}</p>
      ) : null}

      <form className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5 max-w-4xl items-end">
        <div className="form-group mb-0 sm:col-span-2 lg:col-span-2">
          <label>ค้นหาเรื่อง</label>
          <input
            className="field"
            name="q"
            defaultValue={q}
            placeholder="ชื่อเรื่อง..."
          />
        </div>
        <div className="form-group mb-0">
          <label>ตั้งแต่วันที่</label>
          <input className="field" type="date" name="from" defaultValue={from} />
        </div>
        <div className="form-group mb-0">
          <label>ถึงวันที่</label>
          <input className="field" type="date" name="to" defaultValue={to} />
        </div>
        <div className="form-group mb-0">
          <label>ผู้สร้าง</label>
          <select className="field" name="creatorId" defaultValue={creatorId ?? ""}>
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

      <div className="rounded-xl border border-[var(--border-color)] bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#f7f6fb] text-left">
            <tr>
              <th className="p-3 font-medium">เรื่อง</th>
              <th className="p-3 font-medium">ประเภท</th>
              <th className="p-3 font-medium">สถานะ</th>
              <th className="p-3 font-medium">ผู้สร้าง</th>
              <th className="p-3 font-medium">อัปเดต</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-[var(--text-muted)]">
                  <p>ไม่พบเอกสาร</p>
                  {!q && !from && !to && !creatorId ? (
                    <p className="mt-2">
                      ยังไม่มีฉบับในหน่วยงาน —{" "}
                      <Link
                        href="/documents/new"
                        className="text-[var(--primary-color)] hover:underline"
                      >
                        เลือกประเภทแล้วสร้างฉบับแรก
                      </Link>
                    </p>
                  ) : null}
                </td>
              </tr>
            ) : (
              documents.map((doc) => {
                const canDelete = isAdmin || doc.createdById === ctx.user.id;
                return (
                  <tr key={doc.id} className="border-t border-[var(--border-color)]">
                    <td className="p-3">
                      <Link
                        href={`/documents/${doc.id}`}
                        className="text-[var(--primary-color)] hover:underline"
                      >
                        {doc.title}
                      </Link>
                    </td>
                    <td className="p-3">{documentTypeLabel(doc.type)}</td>
                    <td className="p-3">{documentStatusLabel(doc.status)}</td>
                    <td className="p-3">{doc.createdBy.name}</td>
                    <td className="p-3 whitespace-nowrap">
                      {doc.updatedAt.toLocaleString("th-TH")}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <form
                          action={async () => {
                            "use server";
                            const result = await duplicateDocumentAction(doc.id);
                            if (result.ok && result.documentId) {
                              redirect(`/documents/${result.documentId}`);
                            }
                          }}
                        >
                          <button type="submit" className="btn-text">
                            คัดลอก
                          </button>
                        </form>
                        {canDelete ? (
                          <form
                            action={async () => {
                              "use server";
                              await deleteDocumentAction(doc.id);
                            }}
                          >
                            <button type="submit" className="btn-text text-red-600">
                              ลบ
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-dashed border-[var(--border-color)] p-4 text-sm text-[var(--text-muted)] flex flex-wrap items-center justify-between gap-2">
        <span>ประเภทอื่น (ประทับตรา, สั่งการ, ประชาสัมพันธ์, รับรอง, ประชุม) — เร็วๆ นี้</span>
        <Link href="/documents/new" className="text-[var(--primary-color)] hover:underline">
          ดูประเภทที่สร้างได้
        </Link>
      </div>
    </div>
  );
}
