import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getActiveMembership } from "@/lib/org-context";
import { AppHeader } from "@/components/nav/AppHeader";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const membership = await getActiveMembership(session.user.id);

  return (
    <div className="app-shell">
      <AppHeader
        userName={session.user.name ?? ""}
        orgName={membership?.organization.name ?? "—"}
      />
      <main id="main-content" className="app-main">
        {children}
      </main>
    </div>
  );
}
