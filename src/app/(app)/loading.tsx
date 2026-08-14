export default function AppLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <p className="text-sm text-[var(--text-muted)]">กำลังโหลด...</p>
      <div className="rounded-xl border border-[var(--border-color)] bg-white p-6 h-32" />
      <div className="rounded-xl border border-[var(--border-color)] bg-white p-6 h-48" />
    </div>
  );
}
