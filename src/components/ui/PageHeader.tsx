export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-medium">{title}</h1>
        {description ? (
          <p className="text-sm text-[var(--text-muted)] mt-1">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
