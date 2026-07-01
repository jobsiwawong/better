"use client";

import { Pin, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { extractPlainText } from "@/lib/tiptap-text";
import type { NoteWithRelations } from "@/lib/queries/notes";

export function NoteList({
  notes,
  selectedNoteId,
  onSelect,
  highlight,
}: {
  notes: NoteWithRelations[];
  selectedNoteId: string | null;
  onSelect: (id: string) => void;
  highlight?: string;
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
        return (
          <button
            key={note.id}
            onClick={() => onSelect(note.id)}
            className={cn(
              "block w-full rounded-xl px-3 py-2 text-left transition-colors hover:bg-accent",
              selectedNoteId === note.id && "bg-accent"
            )}
          >
            <div className="flex items-center gap-1.5">
              {note.pinned && <Pin className="size-3 shrink-0 fill-current text-primary" />}
              {note.isMeeting && <Users className="size-3 shrink-0 text-muted-foreground" />}
              <span className="truncate text-sm font-medium text-foreground">
                <Highlighted text={note.title} query={highlight} />
              </span>
            </div>
            {snippet && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                <Highlighted text={snippet} query={highlight} />
              </p>
            )}
          </button>
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
