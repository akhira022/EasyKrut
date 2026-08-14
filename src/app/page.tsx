import Link from "next/link";
import { PublicHeader } from "@/components/nav/PublicHeader";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <PublicHeader />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-12 md:py-20">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--primary-color)] mb-4">
          เอกสารราชการอิเล็กทรอนิกส์
        </p>
        <h1 className="text-4xl md:text-5xl font-medium leading-tight text-[var(--text-main)] max-w-2xl">
          EASYKRUT
        </h1>
        <p className="mt-4 text-lg text-[var(--text-muted)] max-w-xl">
          สร้างหนังสือราชการ 7 ประเภทตามรูปแบบสารบรรณ พรีวิวสดบนกระดาษ A4
          บันทึกร่วมกันในหน่วยงาน และส่งออก PDF / Word
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/register" className="btn-primary">
            สร้างบัญชีหน่วยงาน
          </Link>
          <Link href="/login" className="btn-secondary">
            มีบัญชีอยู่แล้ว
          </Link>
        </div>

        <ol className="mt-14 grid gap-3 sm:grid-cols-3 max-w-3xl text-sm">
          {[
            { step: "1", title: "สมัครหน่วยงาน", body: "ได้แผน Free และสิทธิ์เจ้าของทันที" },
            {
              step: "2",
              title: "เลือกประเภทหนังสือ",
              body: "ภายนอก ภายใน ประทับตรา คำสั่ง ประกาศ รับรอง และรายงานการประชุม",
            },
            { step: "3", title: "บันทึกและส่งออก", body: "พรีวิว A4 แล้วส่ง PDF หรือ Word" },
          ].map((item) => (
            <li
              key={item.step}
              className="rounded-xl border border-[var(--border-color)] bg-white px-4 py-3"
            >
              <div className="text-[var(--primary-color)] font-medium mb-1">
                ขั้นที่ {item.step}
              </div>
              <div className="font-medium">{item.title}</div>
              <p className="text-[var(--text-muted)] mt-1">{item.body}</p>
            </li>
          ))}
        </ol>

        <section className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "ฟอร์ม + พรีวิวสด",
              body: "กรอกซ้าย เห็นหนังสือขวา เลขไทยและวันที่ พ.ศ. แปลงให้อัตโนมัติ",
            },
            {
              title: "7 ประเภทพร้อมใช้",
              body: "หนังสือภายนอก บันทึกข้อความ ประทับตรา คำสั่ง ประกาศ รับรอง และรายงานการประชุม",
            },
            {
              title: "ทำงานเป็นทีม",
              body: "เชิญสมาชิกเข้าหน่วยงาน เก็บประวัติเอกสารไว้ที่เดียวกัน",
            },
            {
              title: "ส่งออกได้ทั้งคู่",
              body: "ดาวน์โหลด PDF และ Word จากฉบับเดียวกัน โดยคงเลย์เอาต์สารบรรณ",
            },
            {
              title: "พร้อมขยายแผน",
              body: "เริ่ม Free แล้วอัปเกรดเมื่อทีมโต — ชำระเงินผ่านระบบเมื่อหน่วยงานเปิดใช้",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-[var(--border-color)] bg-white p-5"
            >
              <h2 className="font-medium mb-2">{item.title}</h2>
              <p className="text-sm text-[var(--text-muted)]">{item.body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
