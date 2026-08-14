import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="auth-card text-center space-y-4">
        <h1 className="text-2xl font-medium">ไม่พบหน้านี้</h1>
        <p className="text-sm text-[var(--text-muted)]">
          ลิงก์อาจหมดอายุ หรือหน้าที่ต้องการไม่มีแล้ว
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/" className="btn-primary">
            หน้าแรก
          </Link>
          <Link href="/login" className="btn-secondary">
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  );
}
