"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  deleteTag,
  listTagsWithUsage,
  updateTag,
} from "@/app/actions/tags";
import {
  deleteOwner,
  listOwnersWithUsage,
  updateOwner,
} from "@/app/actions/owners";
import { TAG_PALETTE } from "@/lib/tag-palette";
import { pushUndo } from "@/lib/undo-store";
import { cn } from "@/lib/utils";

interface TagRow {
  id: string;
  name: string;
  color: string;
  _count: { taskTags: number; noteTags: number };
}
interface OwnerRow {
  id: string;
  name: string;
  _count: { taskOwners: number };
}

export type ManageLabelsTab = "tags" | "people";

export function openManageLabels(tab: ManageLabelsTab = "tags") {
  window.dispatchEvent(new CustomEvent("open-manage-labels", { detail: { tab } }));
}

function usageText(parts: [number, string][]) {
  const used = parts.filter(([n]) => n > 0);
  if (!used.length) return "unused";
  return used.map(([n, noun]) => `${n} ${noun}${n === 1 ? "" : "s"}`).join(" · ");
}

function NameInput({
  name,
  taken,
  onCommit,
}: {
  name: string;
  taken: string[];
  onCommit: (next: string) => void;
}) {
  const [value, setValue] = React.useState(name);
  const [syncedName, setSyncedName] = React.useState(name);

  if (name !== syncedName) {
    setSyncedName(name);
    setValue(name);
  }

  const commit = () => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === name) {
      setValue(name);
      return;
    }
    if (taken.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(`"${trimmed}" already exists`);
      setValue(name);
      return;
    }
    onCommit(trimmed);
  };

  return (
    <Input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") setValue(name);
      }}
      className="h-8 flex-1 border-transparent bg-transparent text-sm shadow-none hover:border-border focus-visible:border-border"
    />
  );
}

function DeleteButton({ onDelete }: { onDelete: () => void }) {
  const [confirming, setConfirming] = React.useState(false);

  if (confirming) {
    return (
      <Button
        variant="destructive"
        size="sm"
        className="h-7 px-2 text-xs"
        onBlur={() => setConfirming(false)}
        onClick={onDelete}
      >
        Delete?
      </Button>
    );
  }
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-7 text-muted-foreground hover:text-destructive"
      aria-label="Delete"
      onClick={() => setConfirming(true)}
    >
      <Trash2 className="size-3.5" />
    </Button>
  );
}

export function ManageLabelsDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [tab, setTab] = React.useState<ManageLabelsTab>("tags");
  const [tags, setTags] = React.useState<TagRow[]>([]);
  const [owners, setOwners] = React.useState<OwnerRow[]>([]);

  const reload = React.useCallback(() => {
    listTagsWithUsage().then(setTags);
    listOwnersWithUsage().then(setOwners);
  }, []);

  React.useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<{ tab?: ManageLabelsTab }>).detail;
      if (detail?.tab) setTab(detail.tab);
      setOpen(true);
      reload();
    }
    window.addEventListener("open-manage-labels", handler);
    return () => window.removeEventListener("open-manage-labels", handler);
  }, [reload]);

  const refresh = () => {
    reload();
    router.refresh();
  };

  const renameTag = (tag: TagRow, name: string) => {
    const prev = tag.name;
    updateTag(tag.id, { name }).then(refresh);
    pushUndo({
      label: `rename tag "${prev}" to "${name}"`,
      undo: () => updateTag(tag.id, { name: prev }).then(refresh),
      redo: () => updateTag(tag.id, { name }).then(refresh),
    });
  };

  const recolorTag = (tag: TagRow) => {
    const i = TAG_PALETTE.indexOf(tag.color);
    const next = TAG_PALETTE[(i + 1) % TAG_PALETTE.length];
    // Optimistic swap so cycling feels instant.
    setTags((prevTags) =>
      prevTags.map((t) => (t.id === tag.id ? { ...t, color: next } : t))
    );
    updateTag(tag.id, { color: next }).then(() => router.refresh());
  };

  const removeTag = (tag: TagRow) => {
    deleteTag(tag.id).then(refresh);
    toast(`Deleted tag "${tag.name}"`);
  };

  const renameOwner = (owner: OwnerRow, name: string) => {
    const prev = owner.name;
    updateOwner(owner.id, name).then(refresh);
    pushUndo({
      label: `rename "${prev}" to "${name}"`,
      undo: () => updateOwner(owner.id, prev).then(refresh),
      redo: () => updateOwner(owner.id, name).then(refresh),
    });
  };

  const removeOwner = (owner: OwnerRow) => {
    deleteOwner(owner.id).then(refresh);
    toast(`Removed "${owner.name}"`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md gap-4">
        <DialogHeader>
          <DialogTitle>Manage tags &amp; people</DialogTitle>
          <DialogDescription>
            Rename, recolor, or delete. Changes apply everywhere they&rsquo;re used.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as ManageLabelsTab)}>
          <TabsList className="w-full">
            <TabsTrigger value="tags" className="flex-1">
              Tags
            </TabsTrigger>
            <TabsTrigger value="people" className="flex-1">
              People
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tags" className="mt-3 max-h-80 space-y-0.5 overflow-y-auto">
            {tags.length === 0 && (
              <p className="px-1 py-6 text-center text-sm text-muted-foreground">
                No tags yet. Create one from any task or note.
              </p>
            )}
            {tags.map((tag) => (
              <div key={tag.id} className="flex items-center gap-2 rounded-lg px-1 py-0.5 hover:bg-muted/50">
                <button
                  type="button"
                  onClick={() => recolorTag(tag)}
                  className={cn(
                    "size-4 shrink-0 rounded-full ring-offset-background transition-transform",
                    "hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  )}
                  style={{ backgroundColor: tag.color }}
                  aria-label={`Change color of ${tag.name}`}
                  title="Click to change color"
                />
                <NameInput
                  name={tag.name}
                  taken={tags.filter((t) => t.id !== tag.id).map((t) => t.name)}
                  onCommit={(next) => renameTag(tag, next)}
                />
                <span className="shrink-0 text-xs text-muted-foreground">
                  {usageText([
                    [tag._count.taskTags, "task"],
                    [tag._count.noteTags, "note"],
                  ])}
                </span>
                <DeleteButton onDelete={() => removeTag(tag)} />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="people" className="mt-3 max-h-80 space-y-0.5 overflow-y-auto">
            {owners.length === 0 && (
              <p className="px-1 py-6 text-center text-sm text-muted-foreground">
                No people yet. Add an owner from any task.
              </p>
            )}
            {owners.map((owner) => (
              <div key={owner.id} className="flex items-center gap-2 rounded-lg px-1 py-0.5 hover:bg-muted/50">
                <NameInput
                  name={owner.name}
                  taken={owners.filter((o) => o.id !== owner.id).map((o) => o.name)}
                  onCommit={(next) => renameOwner(owner, next)}
                />
                <span className="shrink-0 text-xs text-muted-foreground">
                  {usageText([[owner._count.taskOwners, "task"]])}
                </span>
                <DeleteButton onDelete={() => removeOwner(owner)} />
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
