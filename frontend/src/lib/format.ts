// Shared formatting + style helpers for the dashboard data pages.

export function formatKES(value: number | null | undefined): string {
  if (!value) return "KSh 0";
  return `KSh ${Math.round(value).toLocaleString()}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function statusClasses(status: string): string {
  switch (status) {
    case "Approved":
      return "bg-emerald-100 text-emerald-700";
    case "Declined":
      return "bg-rose-100 text-rose-700";
    case "Under Review":
      return "bg-amber-100 text-amber-700";
    case "Pending Assessment":
      return "bg-indigo-100 text-indigo-700";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function readinessClasses(score: number): string {
  if (score >= 70) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  return "text-rose-600";
}
