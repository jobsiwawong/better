"use client";

import * as React from "react";
import { ChevronRight, Folder, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createFolder, deleteFolder, renameFolder } from "@/app/actions/folders";
import type { NotesData } from "@/lib/queries/notes";

type FolderRow = NotesData["folders"][number];

export function FolderTree({
  folders,
  noteCountByFolder,
  selectedFolderId,
  onSelect,
  onMutated,
}: {
  folders: FolderRow[];
  noteCountByFolder: Map<string | null, number>;
  selectedFolderId: string | null | "all";
  onSelect: (id: string | null | "all") => void;
  onMutated: () => void;
}) {
  const roots = folders.filter((f) => !f.parentId);

  return (
    <div className="space-y-0.5">
      <button
        onClick={() => onSelect("all")}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-accent",
          selectedFolderId === "all" && "bg-accent font-medium"
        )}
      >
        All notes
      </button>
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-accent",
          selectedFolderId === null && "bg-accent font-medium"
        )}
      >
        Unfiled
        {(noteCountByFolder.get(null) ?? 0) > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">
            {noteCountByFolder.get(null)}
          </span>
        )}
      </button>

      <div className="pt-1">
        {roots.map((folder) => (
          <FolderNode
            key={folder.id}
            folder={folder}
            depth={0}
            allFolders={folders}
            noteCountByFolder={noteCountByFolder}
            selectedFolderId={selectedFolderId}
            onSelect={onSelect}
            onMutated={onMutated}
          />
        ))}
      </div>

      <button
        onClick={() => createFolder("New folder").then(onMutated)}
        className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <Plus className="size-3.5" /> New folder
      </button>
    </div>
  );
}

function FolderNode({
  folder,
  depth,
  allFolders,
  noteCountByFolder,
  selectedFolderId,
  onSelect,
  onMutated,
}: {
  folder: FolderRow;
  depth: number;
  allFolders: FolderRow[];
  noteCountByFolder: Map<string | null, number>;
  selectedFolderId: string | null | "all";
  onSelect: (id: string | null | "all") => void;
  onMutated: () => void;
}) {
  const [expanded, setExpanded] = React.useState(true);
  const [renaming, setRenaming] = React.useState(false);
  const [name, setName] = React.useState(folder.name);
  const children = allFolders.filter((f) => f.parentId === folder.id);

  const submitRename = () => {
    setRenaming(false);
    if (name.trim() && name.trim() !== folder.name) {
      renameFolder(folder.id, name.trim()).then(onMutated);
    }
  };

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm hover:bg-accent",
          selectedFolderId === folder.id && "bg-accent font-medium"
        )}
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-muted-foreground"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          <ChevronRight
            className={cn("size-3.5 transition-transform", expanded && "rotate-90")}
          />
        </button>
        <Folder className="size-3.5 shrink-0 text-muted-foreground" />
        {renaming ? (
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={submitRename}
            onKeyDown={(e) => e.key === "Enter" && submitRename()}
            className="h-6 flex-1 px-1 text-sm"
          />
        ) : (
          <button
            onClick={() => onSelect(folder.id)}
            className="flex-1 truncate text-left"
          >
            {folder.name}
          </button>
        )}
        {(noteCountByFolder.get(folder.id) ?? 0) > 0 && !renaming && (
          <span className="text-xs text-muted-foreground">
            {noteCountByFolder.get(folder.id)}
          </span>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-5 shrink-0 rounded opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => createFolder("New folder", folder.id).then(onMutated)}
            >
              <Plus className="size-3.5" /> Add subfolder
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setRenaming(true)}>Rename</DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => deleteFolder(folder.id).then(onMutated)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="size-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {expanded && children.length > 0 && (
        <div>
          {children.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              depth={depth + 1}
              allFolders={allFolders}
              noteCountByFolder={noteCountByFolder}
              selectedFolderId={selectedFolderId}
              onSelect={onSelect}
              onMutated={onMutated}
            />
          ))}
        </div>
      )}
    </div>
  );
}
