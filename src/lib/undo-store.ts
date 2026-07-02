export interface UndoEntry {
  label: string;
  undo: () => Promise<void> | void;
  redo: () => Promise<void> | void;
}

const MAX_ENTRIES = 100;

const undoStack: UndoEntry[] = [];
const redoStack: UndoEntry[] = [];

export function pushUndo(entry: UndoEntry): UndoEntry {
  undoStack.push(entry);
  if (undoStack.length > MAX_ENTRIES) undoStack.shift();
  redoStack.length = 0;
  return entry;
}

export async function performUndo(): Promise<UndoEntry | null> {
  const entry = undoStack.pop();
  if (!entry) return null;
  await entry.undo();
  redoStack.push(entry);
  return entry;
}

export async function performRedo(): Promise<UndoEntry | null> {
  const entry = redoStack.pop();
  if (!entry) return null;
  await entry.redo();
  undoStack.push(entry);
  return entry;
}

// Undo a specific entry (e.g. from a toast button) even if newer entries exist.
export async function undoSpecific(entry: UndoEntry): Promise<void> {
  const i = undoStack.indexOf(entry);
  if (i >= 0) undoStack.splice(i, 1);
  await entry.undo();
  redoStack.push(entry);
}
