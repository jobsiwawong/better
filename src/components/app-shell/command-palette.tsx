"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  CalendarDays,
  KanbanSquare,
  Moon,
  NotebookText,
  Plus,
  Sparkles,
  Sun,
  Tags,
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
import { getSearchIndex, type SearchIndex } from "@/app/actions/search";
import {
  bodySnippet,
  matchesAllTerms,
  queryTerms,
  type Snippet,
} from "@/lib/search-match";

interface ResultRow {
  id: string;
  title: string;
  titleMatch: boolean;
  snippet: Snippet | null;
}

function rankResults(
  entries: SearchIndex["tasks"],
  terms: string[]
): ResultRow[] {
  if (!terms.length) {
    return entries.map((e) => ({
      id: e.id,
      title: e.title,
      titleMatch: true,
      snippet: null,
    }));
  }
  const rows: ResultRow[] = [];
  for (const e of entries) {
    const haystack = `${e.title} ${e.body}`;
    if (!matchesAllTerms(haystack, terms)) continue;
    const titleMatch = matchesAllTerms(e.title, terms);
    rows.push({
      id: e.id,
      title: e.title,
      titleMatch,
      // Only show a body snippet when the title alone didn't already match.
      snippet: titleMatch ? null : bodySnippet(e.body, terms),
    });
  }
  // Title matches first, then content-only matches.
  return rows.sort((a, b) => Number(b.titleMatch) - Number(a.titleMatch));
}

function SnippetText({ snippet }: { snippet: Snippet }) {
  return (
    <span className="line-clamp-1 text-xs text-muted-foreground">
      {snippet.before}
      <mark className="rounded bg-primary/20 px-0.5 text-foreground">
        {snippet.match}
      </mark>
      {snippet.after}
    </span>
  );
}

const EMPTY_INDEX: SearchIndex = { tasks: [], notes: [] };

export function CommandPalette() {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const [open, setOpen] = React.useState(false);
  const [index, setIndex] = React.useState<SearchIndex>(EMPTY_INDEX);
  const [query, setQuery] = React.useState("");

  const openRef = React.useRef(open);
  React.useEffect(() => {
    openRef.current = open;
  }, [open]);

  const changeOpen = React.useCallback((next: boolean) => {
    setOpen(next);
    if (!next) setQuery("");
  }, []);

  React.useEffect(() => {
    function handler(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && (key === "k" || key === "f")) {
        e.preventDefault();
        changeOpen(key === "f" ? true : !openRef.current);
      }
    }
    function openHandler() {
      changeOpen(true);
    }
    window.addEventListener("keydown", handler);
    window.addEventListener("open-command-palette", openHandler);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("open-command-palette", openHandler);
    };
  }, [changeOpen]);

  React.useEffect(() => {
    if (open) getSearchIndex().then(setIndex);
  }, [open]);

  const go = (path: string) => {
    router.push(path);
    changeOpen(false);
  };

  const terms = queryTerms(query);
  const hasQuery = terms.length > 0;
  const taskResults = React.useMemo(
    () => rankResults(index.tasks, terms),
    [index.tasks, terms]
  );
  const noteResults = React.useMemo(
    () => rankResults(index.notes, terms),
    [index.notes, terms]
  );

  const navItems = [
    { label: "Today", icon: Sparkles, onSelect: () => go("/") },
    { label: "Board", icon: KanbanSquare, onSelect: () => go("/board") },
    { label: "Notes", icon: NotebookText, onSelect: () => go("/notes") },
    { label: "Weekly digest", icon: CalendarDays, onSelect: () => go("/digest") },
    {
      label: "Quick add task or note",
      icon: Plus,
      onSelect: () => {
        changeOpen(false);
        window.dispatchEvent(new CustomEvent("open-quick-add"));
      },
    },
    {
      label: "Manage tags & people",
      icon: Tags,
      onSelect: () => {
        changeOpen(false);
        window.dispatchEvent(
          new CustomEvent("open-manage-labels", { detail: { tab: "tags" } })
        );
      },
    },
    {
      label: "Toggle light / dark mode",
      icon: resolvedTheme === "dark" ? Sun : Moon,
      onSelect: () => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
        changeOpen(false);
      },
    },
  ];
  const visibleNavItems = hasQuery
    ? navItems.filter((n) => matchesAllTerms(n.label, terms))
    : navItems;

  const nothingFound =
    hasQuery &&
    visibleNavItems.length === 0 &&
    taskResults.length === 0 &&
    noteResults.length === 0;

  return (
    <CommandDialog open={open} onOpenChange={changeOpen}>
      {/* shouldFilter=false: we filter against titles AND body content ourselves. */}
      <Command shouldFilter={false}>
        <CommandInput
          placeholder="Search tasks, notes, or jump to a page…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {nothingFound && <CommandEmpty>No results found.</CommandEmpty>}

          {visibleNavItems.length > 0 && (
            <CommandGroup heading="Go to">
              {visibleNavItems.map((item) => (
                <CommandItem
                  key={item.label}
                  value={`nav-${item.label}`}
                  onSelect={item.onSelect}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {taskResults.length > 0 && (
            <CommandGroup heading="Tasks">
              {taskResults.map((task) => (
                <CommandItem
                  key={task.id}
                  value={`task-${task.id}`}
                  onSelect={() => go(`/board?task=${task.id}`)}
                  className="items-start"
                >
                  <KanbanSquare className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">{task.title}</span>
                    {task.snippet && <SnippetText snippet={task.snippet} />}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {noteResults.length > 0 && (
            <CommandGroup heading="Notes">
              {noteResults.map((note) => (
                <CommandItem
                  key={note.id}
                  value={`note-${note.id}`}
                  onSelect={() => go(`/notes/${note.id}`)}
                  className="items-start"
                >
                  <NotebookText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">{note.title}</span>
                    {note.snippet && <SnippetText snippet={note.snippet} />}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
