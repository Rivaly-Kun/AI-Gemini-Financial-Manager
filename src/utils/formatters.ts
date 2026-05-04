// ──────────────────────────────────────────────
// Shared formatting utilities
// ──────────────────────────────────────────────

/** Format a number as Philippine Peso currency string. */
export const formatPeso = (value: number): string =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);

/** Format peso with minimum 2 decimal places (for inline ₱ prefix usage). */
export const formatPesoRaw = (value: number): string =>
  value.toLocaleString("en-PH", { minimumFractionDigits: 2 });

/** Format a change percentage like "+1.5%" or "-3.2%". */
export const formatChangePercent = (value: number): string =>
  `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;

/** Get a human-readable time remaining string from a deadline date. */
export const getTimeRemaining = (deadline: string): string => {
  const today = new Date();
  const target = new Date(deadline);
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMonths > 12) {
    const years = Math.floor(diffMonths / 12);
    return `${years} year${years > 1 ? "s" : ""}`;
  } else if (diffMonths > 0) {
    return `${diffMonths} month${diffMonths > 1 ? "s" : ""}`;
  } else {
    return `${diffDays} day${diffDays > 1 ? "s" : ""}`;
  }
};

/** Get the number of days until a due date (can be negative if overdue). */
export const getDaysUntilDue = (dueDate: string): number => {
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/** Normalize a category string for comparison (trim + lowercase). */
export const normalizeCategory = (category: string): string =>
  category.trim().toLowerCase();
