export function StatusBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs rounded-full bg-[#eeeaff] text-[var(--primary-color)] px-2 py-1 whitespace-nowrap">
      {children}
    </span>
  );
}
