import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="app-header">
        <div className="font-medium text-lg tracking-wide">EASYKRUT</div>
        <div className="flex gap-3">
          <Link href="/pricing" className="btn-text">
            ราคา
          </Link>
          <Link href="/login" className="btn-text">
            เข้าสู่ระบบ
          </Link>
          <Link href="/register" className="btn-primary">
            เริ่มใช้งาน
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-20">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--primary-color)] mb-4">
          เอกสารราชการอิเล็กทรอนิกส์
        </p>
        <h1 className="text-4xl md:text-5xl font-medium leading-tight text-[var(--text-main)] max-w-2xl">
          EASYKRUT
        </h1>
        <p className="mt-4 text-lg text-[var(--text-muted)] max-w-xl">
          สร้างหนังสือภายนอกและหนังสือภายในตามรูปแบบสารบรรณ พรีวิวสดบนกระดาษ A4
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
            { step: "2", title: "เลือกประเภทหนังสือ", body: "ภายนอก (ตราครุฑ) หรือภายใน (บันทึก)" },
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

        <section className="mt-16 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "ฟอร์ม + พรีวิวสด",
              body: "กรอกซ้าย เห็นหนังสือขวา เลขไทยและวันที่ พ.ศ. แปลงให้อัตโนมัติ",
            },
            {
              title: "ทำงานเป็นทีม",
              body: "เชิญสมาชิกเข้าหน่วยงาน เก็บประวัติเอกสารไว้ที่เดียวกัน",
            },
            {
              title: "พร้อมขยายแผน",
              body: "เริ่ม Free แล้วอัปเกรดเมื่อทีมโต — รองรับ Checkout Stripe เมื่อเปิดใช้",
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
