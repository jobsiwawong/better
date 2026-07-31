import { isDoneColumnName } from "@/lib/done-column";

// A distinct accent per column so statuses read differently at a glance,
// shared between the Kanban column headers and the List view status pills.
// Done columns are always green; the rest cycle by position. Mid-tones chosen
// to stay legible in both light and dark themes.
const COLUMN_ACCENTS = ["#6a94a8", "#d4a24c", "#8b7bb0", "#c17a5c", "#5a9e8f"];
const DONE_ACCENT = "#3f8f5c";

export function columnAccent(name: string, order: number): string {
  return isDoneColumnName(name)
    ? DONE_ACCENT
    : COLUMN_ACCENTS[order % COLUMN_ACCENTS.length];
}
