import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";
import { getActiveMembership } from "@/lib/org-context";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const membership = await getActiveMembership(session.user.id);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-medium tracking-wide">
            EASYKRUT
          </Link>
          <nav className="hidden sm:flex gap-4 text-sm">
            <Link href="/dashboard">แดชบอร์ด</Link>
            <Link href="/documents">เอกสาร</Link>
            <Link href="/org/settings">หน่วยงาน</Link>
            <Link href="/pricing">แผนราคา</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="text-right hidden sm:block">
            <div>{session.user.name}</div>
            <div className="text-xs text-[var(--text-muted)]">
              {membership?.organization.name ?? "—"}
            </div>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="btn-text">
              ออกจากระบบ
            </button>
          </form>
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
