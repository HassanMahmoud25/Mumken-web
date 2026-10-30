import type { SVGProps } from "react";

const paths = {
  reply: "m9 5-6 6 6 6M3 11h10a7 7 0 0 1 7 7v1",
  chevronDown: "m6 9 6 6 6-6",
  chevronUp: "m6 15 6-6 6 6",
  chevronRight: "m9 5 7 7-7 7",
  retry: "M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 12-1l2 6M4 12l2 6a7 7 0 0 0 12-1",
} as const;

/** Supporting icons stay decorative: the adjacent text names every action. */
export default function Icon({ name, className = "", ...props }: SVGProps<SVGSVGElement> & {
  name: keyof typeof paths;
}) {
  return (
    <svg {...props} aria-hidden="true" focusable="false" width="16" height="16"
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`}>
      <path d={paths[name]} />
    </svg>
  );
}
