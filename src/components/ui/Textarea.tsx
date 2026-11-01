import type { ComponentPropsWithRef } from "react";

export default function Textarea({
  className = "",
  ...props
}: ComponentPropsWithRef<"textarea">) {
  return (
    <textarea
      className={`min-h-24 w-full resize-y rounded-lg border border-slate-500 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600 disabled:bg-slate-50 ${className}`}
      {...props}
    />
  );
}
