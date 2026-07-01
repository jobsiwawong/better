"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  CalendarDays,
  KanbanSquare,
  Moon,
  NotebookText,
  Sparkles,
  Sun,
} from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { getSearchIndex } from "@/app/actions/search";

interface SearchIndex {
  tasks: { id: string; title: string; columnId: string }[];
  notes: { id: string; title: string }[];
}

export function CommandPalette() {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const [open, setOpen] = React.useState(false);
  const [index, setIndex] = React.useState<SearchIndex>({ tasks: [], notes: [] });

  React.useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    function openHandler() {
      setOpen(true);
    }
    window.addEventListener("keydown", handler);
    window.addEventListener("open-command-palette", openHandler);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("open-command-palette", openHandler);
    };
  }, []);

  React.useEffect(() => {
    if (open) getSearchIndex().then(setIndex);
  }, [open]);

  const go = (path: string) => {
    router.push(path);
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command>
        <CommandInput placeholder="Search tasks, notes, or jump to a page…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Go to">
            <CommandItem onSelect={() => go("/")}>
              <Sparkles className="size-4" /> Today
            </CommandItem>
            <CommandItem onSelect={() => go("/board")}>
              <KanbanSquare className="size-4" /> Board
            </CommandItem>
            <CommandItem onSelect={() => go("/notes")}>
              <NotebookText className="size-4" /> Notes
            </CommandItem>
            <CommandItem onSelect={() => go("/digest")}>
              <CalendarDays className="size-4" /> Weekly digest
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setTheme(resolvedTheme === "dark" ? "light" : "dark");
                setOpen(false);
              }}
            >
              {resolvedTheme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
              Toggle light / dark mode
            </CommandItem>
          </CommandGroup>

          {index.tasks.length > 0 && (
            <CommandGroup heading="Tasks">
              {index.tasks.map((task) => (
                <CommandItem key={task.id} onSelect={() => go("/board/list")}>
                  <KanbanSquare className="size-4 shrink-0 text-muted-foreground" />
                  {task.title}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {index.notes.length > 0 && (
            <CommandGroup heading="Notes">
              {index.notes.map((note) => (
                <CommandItem key={note.id} onSelect={() => go(`/notes/${note.id}`)}>
                  <NotebookText className="size-4 shrink-0 text-muted-foreground" />
                  {note.title}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
