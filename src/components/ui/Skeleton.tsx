/** Decorative placeholder; the containing loading region provides its announcement. */
export default function Skeleton({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`skeleton block rounded ${className}`}
    />
  );
}
