export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border-color)] bg-white p-6 text-center space-y-3">
      <h2 className="font-medium">{title}</h2>
      {description ? <p className="text-sm text-[var(--text-muted)]">{description}</p> : null}
      {action}
    </div>
  );
}
