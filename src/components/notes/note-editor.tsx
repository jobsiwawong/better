"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Pin, PinOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/rich-text-editor";
import {
  MultiSelectPopover,
  SelectedPill,
} from "@/components/board/multi-select-popover";
import {
  archiveNote,
  convertActionItemToTask,
  restoreNote,
  updateNote,
} from "@/app/actions/notes";
import { createTag } from "@/app/actions/tags";
import type { NotesData, NoteWithRelations } from "@/lib/queries/notes";
import { pushUndo, undoSpecific } from "@/lib/undo-store";
import { openManageLabels } from "@/components/app-shell/manage-labels-dialog";

export function NoteEditor({
  note,
  tags,
  onMutated,
  onDeleted,
}: {
  note: NoteWithRelations;
  tags: NotesData["tags"];
  onMutated: () => void;
  onDeleted: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = React.useState(note.title);
  const [participants, setParticipants] = React.useState(note.participants ?? "");
  const [agenda, setAgenda] = React.useState(note.agenda ?? "");
  const [actionItemsRaw, setActionItemsRaw] = React.useState(note.actionItemsRaw ?? "");
  const [tagIds, setTagIds] = React.useState(note.tags.map((t) => t.tag.id));
  const [tagList, setTagList] = React.useState(tags);

  const refresh = () => {
    router.refresh();
    onMutated();
  };

  const commitTitle = () => {
    if (title.trim() !== note.title) {
      updateNote(note.id, { title }).then(refresh);
    }
  };

  const commitParticipants = () => {
    if (participants !== (note.participants ?? "")) {
      updateNote(note.id, { participants }).then(refresh);
    }
  };

  const commitAgenda = () => {
    if (agenda !== (note.agenda ?? "")) {
      updateNote(note.id, { agenda }).then(refresh);
    }
  };

  const commitActionItems = (next: string) => {
    setActionItemsRaw(next);
    updateNote(note.id, { actionItemsRaw: next }).then(refresh);
  };

  const actionItems = actionItemsRaw.split("\n").filter((l) => l.trim());

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-4 overflow-y-auto px-8 py-8">
      <div className="flex items-center justify-between gap-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitTitle}
          className="h-auto flex-1 border-none px-0 text-2xl font-semibold shadow-none focus-visible:ring-0"
          placeholder="Untitled note"
        />
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => updateNote(note.id, { pinned: !note.pinned }).then(refresh)}
            aria-label={note.pinned ? "Unpin note" : "Pin note"}
          >
            {note.pinned ? (
              <Pin className="size-4 fill-current text-primary" />
            ) : (
              <PinOff className="size-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-destructive hover:text-destructive"
            onClick={() => {
              const title = note.title;
              archiveNote(note.id).then(() => {
                onDeleted();
                const entry = pushUndo({
                  label: `delete "${title}"`,
                  undo: () => restoreNote(note.id).then(() => router.refresh()),
                  redo: () => archiveNote(note.id).then(() => router.refresh()),
                });
                toast(`Deleted "${title}"`, {
                  action: {
                    label: "Undo",
                    onClick: () => undoSpecific(entry),
                  },
                });
              });
            }}
            aria-label="Delete note"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {tagIds.map((id) => {
          const tag = tagList.find((t) => t.id === id);
          if (!tag) return null;
          return (
            <SelectedPill
              key={id}
              label={tag.name}
              color={tag.color}
              onRemove={() => {
                const next = tagIds.filter((x) => x !== id);
                setTagIds(next);
                updateNote(note.id, { tagIds: next }).then(refresh);
              }}
            />
          );
        })}
        <MultiSelectPopover
          triggerLabel="Tag"
          items={tagList.map((t) => ({ id: t.id, label: t.name, color: t.color }))}
          selectedIds={tagIds}
          onToggle={(id) => {
            const prev = tagIds;
            const next = tagIds.includes(id)
              ? tagIds.filter((x) => x !== id)
              : [...tagIds, id];
            setTagIds(next);
            updateNote(note.id, { tagIds: next }).then(refresh);
            pushUndo({
              label: "note tags",
              undo: () => {
                setTagIds(prev);
                return updateNote(note.id, { tagIds: prev }).then(refresh);
              },
              redo: () => {
                setTagIds(next);
                return updateNote(note.id, { tagIds: next }).then(refresh);
              },
            });
          }}
          onCreate={async (name) => {
            const created = await createTag(name);
            setTagList((prev) => [...prev, created]);
            return created;
          }}
          onManage={() => openManageLabels("tags")}
          manageLabel="Edit tags…"
        />
      </div>

      {note.isMeeting && (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Participants</Label>
            <Textarea
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              onBlur={commitParticipants}
              placeholder="Who's in the meeting… (e.g. Priya Nair, Jordan Lee)"
              className="min-h-12 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Agenda</Label>
            <Textarea
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              onBlur={commitAgenda}
              placeholder="What's on the agenda…"
              className="min-h-16 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Action items</Label>
            <p className="text-xs text-muted-foreground">
              One item per line. Click the arrow to turn a line into a task.
            </p>
            <Textarea
              value={actionItemsRaw}
              onChange={(e) => setActionItemsRaw(e.target.value)}
              onBlur={() => commitActionItems(actionItemsRaw)}
              placeholder="Follow up with legal on contractor agreement"
              className="min-h-16 text-sm"
            />
            {actionItems.length > 0 && (
              <ul className="space-y-1 pt-1">
                {actionItems.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-lg bg-muted px-2.5 py-1.5 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate">{item}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 shrink-0 gap-1 rounded-full px-2 text-xs"
                      onClick={() => {
                        const remaining = actionItems.filter((_, idx) => idx !== i);
                        setActionItemsRaw(remaining.join("\n"));
                        convertActionItemToTask(note.id, item, remaining).then(refresh);
                      }}
                    >
                      Add as task <ArrowRight className="size-3" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {note.tasks.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          Linked to:
          {note.tasks.map((t) => (
            <span
              key={t.task.id}
              className="rounded-full bg-muted px-2 py-0.5 font-medium text-foreground"
            >
              {t.task.title}
            </span>
          ))}
        </div>
      )}

      <RichTextEditor
        key={note.id}
        content={note.content}
        onChange={(json) => updateNote(note.id, { content: JSON.stringify(json) }).then(refresh)}
        placeholder={note.isMeeting ? "Freeform notes…" : "Start writing…"}
        variant="full"
        minHeight="16rem"
        className="flex-1"
      />
    </div>
  );
}
