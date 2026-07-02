const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// isoDate is "YYYY-MM-DD" — parsed manually to avoid UTC/local timezone shifts.
export function formatExpiryDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

export function formatDaysLeftLabel(
  status: "missing" | "valid" | "expiring_soon" | "expired",
  days: number | null,
): string {
  if (status === "missing" || days === null) return "";
  if (status === "expired") return days === 0 ? "Expires today" : "Expired";
  return `${days} day${days === 1 ? "" : "s"} left`;
}
