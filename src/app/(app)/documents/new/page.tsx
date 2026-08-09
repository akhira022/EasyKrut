import Link from "next/link";
import { redirect } from "next/navigation";
import {
  createExternalDocumentAction,
  createInternalDocumentAction,
} from "@/lib/actions/documents";
import { canCreateDocument, getPlan } from "@/lib/entitlements";
import { requireOrgContext } from "@/lib/org-context";

async function createExternalDoc() {
  "use server";
  const result = await createExternalDocumentAction();
  if (result.ok && result.documentId) {
    redirect(`/documents/${result.documentId}`);
  }
  redirect(`/documents/new?error=${encodeURIComponent(result.error ?? "สร้างไม่สำเร็จ")}`);
}

async function createInternalDoc() {
  "use server";
  const result = await createInternalDocumentAction();
  if (result.ok && result.documentId) {
    redirect(`/documents/${result.documentId}`);
  }
  redirect(`/documents/new?error=${encodeURIComponent(result.error ?? "สร้างไม่สำเร็จ")}`);
}

const COMING_SOON = [
  { title: "หนังสือประทับตรา", note: "แบบที่ 3" },
  { title: "หนังสือสั่งการ", note: "คำสั่ง / ระเบียบ / ข้อบังคับ" },
  { title: "หนังสือประชาสัมพันธ์", note: "ประกาศ / แถลงการณ์ / ข่าว" },
  { title: "หลักฐานในราชการ", note: "รับรอง / รายงานประชุม" },
] as const;

export default async function NewDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const ctx = await requireOrgContext();
  const sp = await searchParams;
  const plan = getPlan(ctx.organization.planKey);
  const gate = canCreateDocument({
    planKey: ctx.organization.planKey,
    seatLimit: ctx.organization.seatLimit,
    docLimitMonthly: ctx.organization.docLimitMonthly,
    memberCount: ctx.memberCount,
    docsCreatedThisMonth: ctx.docsCreatedThisMonth,
  });

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <p className="text-sm text-[var(--text-muted)] mb-2">
          <Link href="/documents" className="text-[var(--primary-color)] hover:underline">
            ประวัติเอกสาร
          </Link>
          <span className="mx-2">/</span>
          สร้างใหม่
        </p>
        <h1 className="text-2xl font-medium">เลือกประเภทหนังสือ</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          เลือกชนิดเอกสาร แล้วเข้าฟอร์มพร้อมพรีวิว A4 ทันที · แผน {plan.name} ใช้ไปแล้ว{" "}
          {ctx.docsCreatedThisMonth}/{ctx.organization.docLimitMonthly} ฉบับเดือนนี้
        </p>
      </div>

      {sp.error ? (
        <p className="rounded-md bg-red-50 text-red-700 px-3 py-2 text-sm">{sp.error}</p>
      ) : null}

      {!gate.ok ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 space-y-2">
          <p>{gate.reason}</p>
          <Link href="/pricing" className="text-[var(--primary-color)] hover:underline">
            ดูแผนราคาและอัปเกรด
          </Link>
        </div>
      ) : null}

      <ol className="grid gap-2 text-sm text-[var(--text-muted)] sm:grid-cols-3">
        <li className="rounded-lg border border-[var(--border-color)] bg-white px-3 py-2">
          <span className="text-[var(--primary-color)] font-medium">1.</span> เลือกประเภท
        </li>
        <li className="rounded-lg border border-[var(--border-color)] bg-white px-3 py-2">
          <span className="text-[var(--primary-color)] font-medium">2.</span> กรอก + พรีวิวสด
        </li>
        <li className="rounded-lg border border-[var(--border-color)] bg-white px-3 py-2">
          <span className="text-[var(--primary-color)] font-medium">3.</span> บันทึก / ส่งออก
        </li>
      </ol>

      <section className="space-y-3">
        <h2 className="font-medium">พร้อมใช้งาน</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <form action={createExternalDoc}>
            <button
              type="submit"
              disabled={!gate.ok}
              className="w-full h-full text-left rounded-xl border border-[var(--border-color)] bg-white p-5 hover:border-[var(--primary-color)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-xs uppercase tracking-wide text-[var(--primary-color)] mb-2">
                แบบที่ 1
              </div>
              <div className="font-medium text-lg">หนังสือภายนอก</div>
              <p className="text-sm text-[var(--text-muted)] mt-2">
                กระดาษตราครุฑ สำหรับติดต่อหน่วยงานภายนอก พร้อมเลขไทยและวันที่ พ.ศ.
              </p>
            </button>
          </form>

          <form action={createInternalDoc}>
            <button
              type="submit"
              disabled={!gate.ok}
              className="w-full h-full text-left rounded-xl border border-[var(--border-color)] bg-white p-5 hover:border-[var(--primary-color)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-xs uppercase tracking-wide text-[var(--primary-color)] mb-2">
                แบบที่ 2
              </div>
              <div className="font-medium text-lg">หนังสือภายใน</div>
              <p className="text-sm text-[var(--text-muted)] mt-2">
                บันทึกข้อความสำหรับติดต่อภายในหน่วยงาน
              </p>
            </button>
          </form>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">เร็วๆ นี้</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {COMING_SOON.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-dashed border-[var(--border-color)] bg-[#faf9ff] p-5 opacity-80"
            >
              <div className="text-xs text-[var(--text-muted)] mb-2">{item.note}</div>
              <div className="font-medium">{item.title}</div>
              <p className="text-sm text-[var(--text-muted)] mt-2">ยังไม่เปิดใช้งาน</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
