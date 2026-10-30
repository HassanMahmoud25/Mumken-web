import type { Comment, Locale, RecordItem, User } from "./discussion.types";

function creationTime(comment: Comment): number {
  const timestamp = Date.parse(comment.createdAt);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function getRecordComments(
  comments: readonly Comment[],
  recordId: string,
): Comment[] {
  return comments
    .filter((comment) => comment.recordId === recordId)
    .sort(
      (a, b) => creationTime(a) - creationTime(b),
    );
}

export function getRootComments(comments: readonly Comment[]): Comment[] {
  // filter creates a copy. Reverse gives later insertions priority on equal dates.
  return comments
    .filter((comment) => comment.parentId === null)
    .reverse()
    .sort((a, b) => creationTime(b) - creationTime(a));
}

export function getReplies(comments: readonly Comment[], parentId: string): Comment[] {
  return comments
    .filter((comment) => comment.parentId === parentId)
    .sort((a, b) => creationTime(a) - creationTime(b));
}

// ISO UTC instants are converted only for display; omitted timezone uses the viewer's local zone.
export function formatDate(date: string, locale: Locale, timeZone?: string): string {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    calendar: "gregory",
    timeZone,
  }).format(parsedDate);
}

export function getUserById(users: User[], userId: string): User | undefined {
  return users.find((user) => user.id === userId);
}

export function getRecordById(
  records: RecordItem[],
  recordId: string,
): RecordItem | undefined {
  return records.find((record) => record.id === recordId);
}
