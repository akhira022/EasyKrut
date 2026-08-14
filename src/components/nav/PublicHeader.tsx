import Link from "next/link";

export function PublicHeader({
  primaryHref = "/register",
  primaryLabel = "เริ่มใช้งาน",
}: {
  primaryHref?: string;
  primaryLabel?: string;
}) {
  return (
    <header className="app-header">
      <Link href="/" className="font-medium text-lg tracking-wide shrink-0">
        EASYKRUT
      </Link>
      <div className="flex flex-wrap gap-2 justify-end">
        <Link href="/pricing" className="btn-text">
          ราคา
        </Link>
        <Link href="/login" className="btn-text">
          เข้าสู่ระบบ
        </Link>
        <Link href={primaryHref} className="btn-primary">
          {primaryLabel}
        </Link>
      </div>
    </header>
  );
}
