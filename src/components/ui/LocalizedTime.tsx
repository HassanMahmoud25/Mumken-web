"use client";

import { useSyncExternalStore } from "react";
import { formatDate } from "@/features/discussion/discussion.utils";
import type { Locale } from "@/features/discussion/discussion.types";

const subscribe = () => () => {};
const browserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const serverTimeZone = () => "UTC";

/** UTC during server rendering/hydration, then the viewer's timezone. */
export default function LocalizedTime({ dateTime, locale, className }: {
  dateTime: string;
  locale: Locale;
  className?: string;
}) {
  const timeZone = useSyncExternalStore(subscribe, browserTimeZone, serverTimeZone);
  return <time dateTime={dateTime} className={className}>{formatDate(dateTime, locale, timeZone)}</time>;
}
