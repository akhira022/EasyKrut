import Link from "next/link";
import { redirect } from "next/navigation";
import { createExternalDocumentAction } from "@/lib/actions/documents";
import { deleteDocumentAction } from "@/lib/actions/documents";
import { prisma } from "@/lib/db";
import { requireOrgContext } from "@/lib/org-context";

async function createDoc() {
  "use server";
  const result = await createExternalDocumentAction();
  if (result.ok && result.documentId) {
    redirect(`/documents/${result.documentId}`);
  }
  redirect(`/documents?error=${encodeURIComponent(result.error ?? "สร้างไม่สำเร็จ")}`);
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; q?: string }>;
}) {
  const ctx = await requireOrgContext();
  const sp = await searchParams;
  const q = sp.q?.trim();

  const documents = await prisma.document.findMany({
    where: {
      organizationId: ctx.organization.id,
      ...(q
        ? {
            title: { contains: q },
          }
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
        <form action={createDoc}>
          <button type="submit" className="btn-primary">
            + สร้างหนังสือภายนอก
          </button>
        </form>
      </div>

      {sp.error ? (
        <p className="rounded-md bg-red-50 text-red-700 px-3 py-2 text-sm">{sp.error}</p>
      ) : null}

      <form className="flex gap-2 max-w-md">
        <input
          className="field"
          name="q"
          defaultValue={q}
          placeholder="ค้นหาจากชื่อเรื่อง..."
        />
        <button type="submit" className="btn-secondary">
          ค้นหา
        </button>
      </form>

      <div className="rounded-xl border border-[var(--border-color)] bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#f7f6fb] text-left">
            <tr>
              <th className="p-3 font-medium">เรื่อง</th>
              <th className="p-3 font-medium">สถานะ</th>
              <th className="p-3 font-medium">ผู้สร้าง</th>
              <th className="p-3 font-medium">อัปเดต</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-[var(--text-muted)]">
                  ไม่พบเอกสาร
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
                    <td className="p-3">{doc.status === "FINAL" ? "สมบูรณ์" : "ร่าง"}</td>
                    <td className="p-3">{doc.createdBy.name}</td>
                    <td className="p-3 whitespace-nowrap">
                      {doc.updatedAt.toLocaleString("th-TH")}
                    </td>
                    <td className="p-3 text-right">
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
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-dashed border-[var(--border-color)] p-4 text-sm text-[var(--text-muted)]">
        ประเภทอื่น (หนังสือภายใน, รายงานการประชุม, สั่งการ, รับรอง) — เร็วๆ นี้
      </div>
    </div>
  );
}
