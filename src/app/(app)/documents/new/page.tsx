import Link from "next/link";
import { redirect } from "next/navigation";
import {
  createAnnounceDocumentAction,
  createCertDocumentAction,
  createExternalDocumentAction,
  createInternalDocumentAction,
  createMeetingDocumentAction,
  createOrderDocumentAction,
  createStampDocumentAction,
} from "@/lib/actions/documents";
import { canCreateDocument, getPlan } from "@/lib/entitlements";
import { requireOrgContext } from "@/lib/org-context";

async function createAndRedirect(
  create: () => Promise<{ ok: boolean; documentId?: string; error?: string }>,
) {
  const result = await create();
  if (result.ok && result.documentId) {
    redirect(`/documents/${result.documentId}`);
  }
  redirect(`/documents/new?error=${encodeURIComponent(result.error ?? "สร้างไม่สำเร็จ")}`);
}

async function createExternalDoc() {
  "use server";
  await createAndRedirect(createExternalDocumentAction);
}
async function createInternalDoc() {
  "use server";
  await createAndRedirect(createInternalDocumentAction);
}
async function createStampDoc() {
  "use server";
  await createAndRedirect(createStampDocumentAction);
}
async function createOrderDoc() {
  "use server";
  await createAndRedirect(createOrderDocumentAction);
}
async function createAnnounceDoc() {
  "use server";
  await createAndRedirect(createAnnounceDocumentAction);
}
async function createCertDoc() {
  "use server";
  await createAndRedirect(createCertDocumentAction);
}
async function createMeetingDoc() {
  "use server";
  await createAndRedirect(createMeetingDocumentAction);
}

const READY = [
  {
    form: createExternalDoc,
    formId: "1",
    title: "หนังสือภายนอก",
    note: "กระดาษตราครุฑ สำหรับติดต่อหน่วยงานภายนอก พร้อมเลขไทยและวันที่ พ.ศ.",
  },
  {
    form: createInternalDoc,
    formId: "2",
    title: "หนังสือภายใน",
    note: "บันทึกข้อความสำหรับติดต่อภายในหน่วยงาน",
  },
  {
    form: createStampDoc,
    formId: "3",
    title: "หนังสือประทับตรา",
    note: "กระดาษตราครุฑ · ประทับตราแทนการลงชื่อ สำหรับเรื่องที่ไม่ใช่ราชการสำคัญ",
  },
  {
    form: createOrderDoc,
    formId: "4",
    title: "คำสั่ง",
    note: "หนังสือสั่งการ · ผู้บังคับบัญชาสั่งให้ปฏิบัติ",
  },
  {
    form: createAnnounceDoc,
    formId: "7",
    title: "ประกาศ",
    note: "หนังสือประชาสัมพันธ์ · ชี้แจงหรือแนะแนวทางปฏิบัติ (รองรับแจ้งความ)",
  },
  {
    form: createCertDoc,
    formId: "10",
    title: "หนังสือรับรอง",
    note: "หลักฐานในราชการ · รับรองบุคคล นิติบุคคล หรือหน่วยงาน",
  },
  {
    form: createMeetingDoc,
    formId: "11",
    title: "รายงานการประชุม",
    note: "บันทึกผู้มาประชุม ความเห็น และมติ · ไม่ใช้ตราครุฑ",
  },
] as const;

const COMING_SOON = [
  { title: "ระเบียบ / ข้อบังคับ", note: "หนังสือสั่งการ · แบบที่ 5–6" },
  { title: "แถลงการณ์ / ข่าว", note: "หนังสือประชาสัมพันธ์ · แบบที่ 8–9" },
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
          {READY.map((item) => (
            <form action={item.form} key={item.formId}>
              <button
                type="submit"
                disabled={!gate.ok}
                className="w-full h-full text-left rounded-xl border border-[var(--border-color)] bg-white p-5 hover:border-[var(--primary-color)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="text-xs uppercase tracking-wide text-[var(--primary-color)] mb-2">
                  แบบที่ {item.formId}
                </div>
                <div className="font-medium text-lg">{item.title}</div>
                <p className="text-sm text-[var(--text-muted)] mt-2">{item.note}</p>
              </button>
            </form>
          ))}
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
