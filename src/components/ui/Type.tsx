import { cn } from "@/lib/cn";

/**
 * TYPE PRIMITIVES
 *
 * Small pieces of furniture that appear in more than one section, so they can
 * only drift out of sync in one place.
 */

/**
 * Section label: index, rule, name. Repeated at the head of every section —
 * it is the site's navigational spine, so it is one component, not a pattern.
 */
export function SectionHead({
  n,
  label,
  className,
}: {
  n: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <span className="micro nums text-accent-ink">{n}</span>
      <span className="h-px w-10 bg-line sm:w-16" aria-hidden="true" />
      <span className="micro text-muted">{label}</span>
    </div>
  );
}

/** Availability pill. The dot pulses only while the profile says available. */
export function Availability({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full border border-line px-3.5 py-2",
        className
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-70" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-signal" />
      </span>
      <span className="micro text-muted">Available for work</span>
    </span>
  );
}
