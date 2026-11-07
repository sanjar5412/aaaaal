import { cn } from "@/lib/cn";

/** Базовая поверхность панели. */
export function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={cn("panel", className)}>{children}</section>;
}
