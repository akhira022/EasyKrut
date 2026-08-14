export function Alert({
  tone = "info",
  children,
  live = true,
}: {
  tone?: "info" | "success" | "error" | "warn";
  children: React.ReactNode;
  live?: boolean;
}) {
  return (
    <div className={`alert alert-${tone}`} role={tone === "error" ? "alert" : "status"} aria-live={live ? "polite" : undefined}>
      {children}
    </div>
  );
}
