import type { Locale } from "../discussion.types";
import DiscussionSkeleton from "./DiscussionSkeleton";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";

interface DiscussionStateProps {
  kind: "loading" | "error" | "unavailable";
  loadingText: string;
  loadingView?: "list" | "detail";
  locale?: Locale;
  errorText: string;
  unavailableTitle: string;
  unavailableText: string;
  retryText: string;
  onRetry?: () => void;
}

export default function DiscussionState({
  kind,
  loadingText,
  loadingView = "detail",
  locale = "en",
  errorText,
  unavailableTitle,
  unavailableText,
  retryText,
  onRetry,
}: DiscussionStateProps) {
  if (kind === "loading") {
    return (
      <div>
        <DiscussionSkeleton
          view={loadingView}
          label={loadingText}
          locale={locale}
        />
      </div>
    );
  }

  if (kind === "unavailable") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
        <h2 className="font-semibold text-slate-900">{unavailableTitle}</h2>
        <p className="mt-2 text-sm text-slate-500">{unavailableText}</p>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center"
    >
      <p className="text-sm text-red-800">{errorText}</p>
      {onRetry && (
        <Button className="mt-4" onClick={onRetry}>
          <Icon name="retry" />
          {retryText}
        </Button>
      )}
    </div>
  );
}
