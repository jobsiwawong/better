"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { FileText, Plus, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FolderTree,
  ROOT_DROP_ID,
  UNFILED_DROP_ID,
} from "@/components/notes/folder-tree";
import { NoteList } from "@/components/notes/note-list";
import { NoteEditor } from "@/components/notes/note-editor";
import { archiveNote, createNote, moveNote, restoreNote } from "@/app/actions/notes";
import { moveFolder } from "@/app/actions/folders";
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  // One handler drives both drag types: notes drop onto folders (or Unfiled)
  // to refile; folders drop onto folders (or All notes) to re-nest.
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const overId = String(over.id);
    const type = active.data.current?.type;

    if (type === "note") {
      const noteId = String(active.id);
      const note = notes.find((n) => n.id === noteId);
      if (!note) return;
      // Notes have no meaning on the "All notes" bucket; ignore that target.
      if (overId === ROOT_DROP_ID) return;
      const newFolderId = overId === UNFILED_DROP_ID ? null : overId;
      if (note.folderId === newFolderId) return;
      const prevFolderId = note.folderId;

      moveNote(noteId, newFolderId).then(refreshData);
      pushUndo({
        label: `move note "${note.title}"`,
        undo: () => moveNote(noteId, prevFolderId).then(refreshData),
        redo: () => moveNote(noteId, newFolderId).then(refreshData),
      });
      return;
    }

    // Folder re-nesting.
    const folderId = String(active.id);
    if (overId === folderId) return;
    // Dropping a folder onto its own descendant would create a cycle.
    if (overId !== ROOT_DROP_ID && folderDescendantIds.get(folderId)?.has(overId)) return;
    // Unfiled is a notes-only target; ignore it for folders.
    if (overId === UNFILED_DROP_ID) return;

    const newParentId = overId === ROOT_DROP_ID ? null : overId;
    const folder = folders.find((f) => f.id === folderId);
    if (!folder || folder.parentId === newParentId) return;
    const prevParentId = folder.parentId;

    moveFolder(folderId, newParentId).then(refreshData);
    pushUndo({
      label: `move folder "${folder.name}"`,
      undo: () => moveFolder(folderId, prevParentId).then(refreshData),
      redo: () => moveFolder(folderId, newParentId).then(refreshData),
    });
  };

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

        <DndContext id="notes-dnd" sensors={sensors} onDragEnd={handleDragEnd}>
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
        </DndContext>
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
