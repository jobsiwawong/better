"use client";

import { Pin, Trash2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { extractPlainText } from "@/lib/tiptap-text";
import type { NoteWithRelations } from "@/lib/queries/notes";

export function NoteList({
  notes,
  selectedNoteId,
  onSelect,
  onDelete,
  highlight,
  folderNameById,
  selectedFolderId,
}: {
  notes: NoteWithRelations[];
  selectedNoteId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  highlight?: string;
  folderNameById?: Map<string, string>;
  selectedFolderId?: string | null | "all";
}) {
  if (notes.length === 0) {
    return (
      <div className="px-3 py-8 text-center text-sm text-muted-foreground">
        No notes here yet.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {notes.map((note) => {
        const snippet = extractPlainText(note.content).slice(0, 80);
        // Show which folder a note lives in whenever the list mixes notes
        // from more than one folder (all-notes view, or a parent folder
        // whose count aggregates its subfolders) — redundant otherwise.
        const showFolderTag =
          note.folderId &&
          folderNameById &&
          (selectedFolderId === "all" || note.folderId !== selectedFolderId);
        const folderTag = showFolderTag
          ? folderNameById!.get(note.folderId!)
          : undefined;
        return (
          <div
            key={note.id}
            className={cn(
              "group relative rounded-xl transition-colors hover:bg-accent",
              selectedNoteId === note.id && "bg-accent"
            )}
          >
            <button
              onClick={() => onSelect(note.id)}
              className="block w-full rounded-xl px-3 py-2 pr-9 text-left"
            >
              <div className="flex items-center gap-1.5">
                {note.pinned && <Pin className="size-3 shrink-0 fill-current text-primary" />}
                {note.isMeeting && <Users className="size-3 shrink-0 text-muted-foreground" />}
                <span className="truncate text-sm font-medium text-foreground">
                  <Highlighted text={note.title} query={highlight} />
                </span>
                {folderTag && (
                  <span className="ml-auto shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {folderTag}
                  </span>
                )}
              </div>
              {snippet && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  <Highlighted text={snippet} query={highlight} />
                </p>
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(note.id);
              }}
              aria-label={`Delete ${note.title}`}
              title="Delete note"
              className="absolute right-1.5 top-1.5 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-destructive focus:opacity-100 group-hover:opacity-100"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function Highlighted({ text, query }: { text: string; query?: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-primary/25 text-inherit">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}
