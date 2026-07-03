// A column counts as "done" when its name reads like completion. Completing a
// task and dropping it in a done column are treated as the same thing.
export function isDoneColumnName(name: string) {
  return /\b(done|complete|completed|shipped)\b/i.test(name);
}
