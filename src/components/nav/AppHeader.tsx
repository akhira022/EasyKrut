"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth";

const LINKS = [
  { href: "/dashboard", label: "แดชบอร์ด" },
  { href: "/documents", label: "เอกสาร" },
  { href: "/documents/new", label: "สร้าง" },
  { href: "/org/settings", label: "หน่วยงาน" },
  { href: "/pricing", label: "ราคา" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/documents") {
    return pathname === "/documents" || pathname.startsWith("/documents/");
  }
  if (href === "/documents/new") return pathname === "/documents/new";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppHeader({
  userName,
  orgName,
}: {
  userName: string;
  orgName: string;
}) {
  const pathname = usePathname();
  const documentsActive = pathname === "/documents" || (pathname.startsWith("/documents/") && pathname !== "/documents/new" && !pathname.startsWith("/documents/new/"));

  return (
    <>
      <a href="#main-content" className="skip-link">
        ข้ามไปเนื้อหา
      </a>
      <header className="app-header">
        <div className="flex items-center gap-4 min-w-0">
          <Link href="/dashboard" className="font-medium tracking-wide">
            EASYKRUT
          </Link>
          <nav className="hidden sm:flex app-header-nav gap-1 text-sm" aria-label="เมนูหลัก">
            {LINKS.filter((l) => l.href !== "/documents/new").map((link) => {
              const active =
                link.href === "/documents" ? documentsActive : isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="text-right hidden sm:block min-w-0">
            <div className="truncate">{userName}</div>
            <div className="text-xs text-[var(--text-muted)] truncate">{orgName}</div>
          </div>
          <Link href="/documents/new" className="btn-primary desktop-only">
            สร้างเอกสาร
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="btn-text">
              ออกจากระบบ
            </button>
          </form>
        </div>
      </header>
      <nav className="app-bottom-nav no-print" aria-label="เมนูล่าง">
        {LINKS.map((link) => {
          const active =
            link.href === "/documents"
              ? documentsActive
              : isActive(pathname, link.href);
          return (
            <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined}>
              {link.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
