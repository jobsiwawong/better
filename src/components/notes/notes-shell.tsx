"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileText, Plus, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FolderTree } from "@/components/notes/folder-tree";
import { NoteList } from "@/components/notes/note-list";
import { NoteEditor } from "@/components/notes/note-editor";
import { archiveNote, createNote, restoreNote } from "@/app/actions/notes";
import { extractPlainText } from "@/lib/tiptap-text";
import { pushUndo, undoSpecific } from "@/lib/undo-store";
import {
  buildAggregateNoteCounts,
  buildFolderDescendantIds,
} from "@/lib/folder-tree-utils";
import type { NotesData } from "@/lib/queries/notes";

export function NotesShell({
  folders,
  notes,
  tags,
  selectedNoteId,
}: {
  folders: NotesData["folders"];
  notes: NotesData["notes"];
  tags: NotesData["tags"];
  selectedNoteId: string | null;
}) {
  const router = useRouter();
  const [selectedFolderId, setSelectedFolderId] = React.useState<string | null | "all">(
    "all"
  );
  const [query, setQuery] = React.useState("");

  const directCountByFolder = React.useMemo(() => {
    const map = new Map<string | null, number>();
    for (const note of notes) {
      map.set(note.folderId, (map.get(note.folderId) ?? 0) + 1);
    }
    return map;
  }, [notes]);

  const folderDescendantIds = React.useMemo(
    () => buildFolderDescendantIds(folders),
    [folders]
  );

  // Badge counts include notes nested in subfolders, so a parent folder's
  // count reflects everything you'll see when you click into it.
  const noteCountByFolder = React.useMemo(() => {
    const aggregate: Map<string | null, number> = buildAggregateNoteCounts(
      folders,
      directCountByFolder
    );
    aggregate.set(null, directCountByFolder.get(null) ?? 0);
    return aggregate;
  }, [folders, directCountByFolder]);

  const folderNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const f of folders) map.set(f.id, f.name);
    return map;
  }, [folders]);

  const filtered = React.useMemo(() => {
    let list = notes;
    if (selectedFolderId !== "all" && selectedFolderId !== null) {
      const ids = folderDescendantIds.get(selectedFolderId) ?? new Set([selectedFolderId]);
      list = list.filter((n) => n.folderId !== null && ids.has(n.folderId));
    } else if (selectedFolderId === null) {
      list = list.filter((n) => n.folderId === null);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          extractPlainText(n.content).toLowerCase().includes(q)
      );
    }
    return list;
  }, [notes, selectedFolderId, query, folderDescendantIds]);

  const selectedNote = notes.find((n) => n.id === selectedNoteId) ?? null;

  const refreshData = () => router.refresh();

  const openNote = (id: string) => router.push(`/notes/${id}`);

  const handleDeleteNote = (id: string) => {
    const note = notes.find((n) => n.id === id);
    const title = note?.title ?? "note";
    archiveNote(id).then(() => {
      router.refresh();
      if (selectedNoteId === id) router.push("/notes");
      const entry = pushUndo({
        label: `delete note "${title}"`,
        undo: () => restoreNote(id).then(() => router.refresh()),
        redo: () => archiveNote(id).then(() => router.refresh()),
      });
      toast(`Deleted "${title}"`, {
        action: { label: "Undo", onClick: () => undoSpecific(entry) },
      });
    });
  };

  const handleNewNote = (isMeeting: boolean) => {
    createNote({
      folderId: selectedFolderId === "all" ? null : selectedFolderId,
      isMeeting,
    }).then((note) => {
      router.refresh();
      router.push(`/notes/${note.id}`);
    });
  };

  return (
    <div className="flex h-full">
      <div className="flex w-72 shrink-0 flex-col border-r border-border">
        <div className="space-y-2 border-b border-border p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes…"
              className="h-8 pl-8 text-sm"
            />
          </div>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-7 flex-1 gap-1 rounded-full text-xs"
              onClick={() => handleNewNote(false)}
            >
              <FileText className="size-3" /> Note
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 flex-1 gap-1 rounded-full text-xs"
              onClick={() => handleNewNote(true)}
            >
              <Users className="size-3" /> Meeting
            </Button>
          </div>
        </div>

        <div className="border-b border-border p-2">
          <FolderTree
            folders={folders}
            noteCountByFolder={noteCountByFolder}
            selectedFolderId={selectedFolderId}
            onSelect={setSelectedFolderId}
            onMutated={refreshData}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <NoteList
            notes={filtered}
            selectedNoteId={selectedNoteId}
            onSelect={openNote}
            onDelete={handleDeleteNote}
            highlight={query.trim() || undefined}
            folderNameById={folderNameById}
            selectedFolderId={selectedFolderId}
          />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        {selectedNote ? (
          <NoteEditor
            key={selectedNote.id}
            note={selectedNote}
            tags={tags}
            onMutated={refreshData}
            onDeleted={() => router.push("/notes")}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
            <FileText className="size-8 opacity-40" />
            <p className="text-sm">Select a note, or create a new one.</p>
            <Button size="sm" className="gap-1.5 rounded-full" onClick={() => handleNewNote(false)}>
              <Plus className="size-3.5" /> New note
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
